$(document).ready(function(){
	var ff=function(id){return document.getElementById(id);}
	//调整webkit兼容性
	window.indexedDB=window.indexedDB||window.webkitIndexedDB;
	var init = false;
	var myDB={
		name:'ubock',
		version:1,
		db:null
	};
	var config = {
		cols:4,
		item_w:200,
		item_h:113
	}
	var item = {
		title:null,
		url:null,
		icon:null
	}
	var storeName = 'bookmark';
	
	initDB(myDB.name,myDB.version);
	
	function getList(){
		var transaction=myDB.db.transaction(storeName,'readonly'); 
		var store=transaction.objectStore(storeName); 
		req = store.openCursor();
		var i=0;
		var ii=0;
		$('table').html('');
		req.onsuccess = function(evt) {
		  var cursor = evt.target.result;
		  if (cursor) {
			$('<style></style>').html('img{width:'+config.item_w+'px;height:'+config.item_h+'px;}').appendTo('head');
						
			var title = cursor.value.title;
			var url = cursor.value.url;
			var icon = cursor.value.icon;
			if(i % config.cols == 0){
				ii++;
				$('table').append('<tr id=id'+ii+'></tr>');
			}
			$('<td></td>').html('<a href="'+url+'"><img src="'+icon+'" alt="'+title+'"/></a>').appendTo('#id'+ii);
			i++;
			
			// Move on to the next object in store
			cursor.continue();

		  } else {
			console.debug("No more entries!");
		  }
		};
	}
	
	ff('pic').addEventListener('keyup', function(ev){
		var ev=ev || window.event;
		if(ev.keyCode==13){
			if (checkInput()){
				addData(ff('name').value, ff('url').value, ff('pic').value);
			}
		}
		ev.preventDefault();
	});
	
	function initDB(name,version) {
            var version=version || 1;
            var request=window.indexedDB.open(name,version);
            request.onerror=function(e){
                console.log(e.currentTarget.error.message);
            };
            request.onsuccess=function(e){
                myDB.db=e.target.result;
				onInit();
				console.log('DB init success, version = '+version);
            };
            request.onupgradeneeded=function(e){
				var db=e.target.result;
				if(!db.objectStoreNames.contains('config')){
                    db.createObjectStore('config',{autoIncrement: true});
                }
				if(!db.objectStoreNames.contains(storeName)){
					var store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
				}
                console.log('DB version changed to '+version);
            };
    }
	
	function onInit(){
		init = true;
		var transaction=myDB.db.transaction('config','readwrite'); 
		var store=transaction.objectStore('config'); 
		var req = store.count();
		req.onsuccess = function(evt) {
		  var count = evt.target.result;
		  if (count == 0){
			  store.put(config); 
		  }
		};
		req.onerror = function(evt) {
		  console.error("error", this.error);
		};
		
		var transaction2=myDB.db.transaction(storeName,'readwrite'); 
		var store2=transaction2.objectStore(storeName); 
		var req2 = store2.count();
		req2.onsuccess = function(evt) {
		  var count = evt.target.result;
		  console.log('Totals:'+count);
		  if (count == 0){
			  initData(); 
		  } else {
			  getList();
		  }
		};
		req2.onerror = function(evt) {
		  console.error("error", this.error);
		};
	}
	
	function addData(name, url, pic){
		if (name == '' || url == ''){
			return false;
		}
		var tx = myDB.db.transaction(storeName, 'readwrite');
		var store = tx.objectStore(storeName);
		item.title = name;
		item.url = url;
		item.icon = pic;
		var req = store.add(item);
		req.onsuccess = function (evt) {
		  console.debug("Insertion in DB successful");
		  getList();
		};
		req.onerror = function() {
		  console.error("add error", this.error);
		};
    }
	
	function closeDB(db){
        db.close();
    }
	
	function checkInput(){
		if (ff('name').value == ''){
			alert('请输入名称');
			ff('name').focus;
			return false;
		} else if (ff('url').value == ''){
			alert('请输入网址');
			ff('url').focus;
			return false;
		}
		return true;
	}
	
	function initData(){
		$.ajax({
			type: "GET",
			url: "default.xml",
			dataType: "xml",
			success: function(xml) {
				$(xml).find('bookmark').each(function(){				
					var title = $(this).find('title').text();
					var url = $(this).find('url').text();
					var icon = $(this).find('icon').text();
					if (title != '' && url != ''){
						addData(title, url, icon)
					}
				});
			}
		});
	}

});