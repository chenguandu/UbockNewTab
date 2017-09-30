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
	var addList = new Array();//等侍添加的列表，因为添加是异步的所以使用个列表来逐个添加，解决显示重复问题
	
	$('<style></style>').html('td a div{width:'+config.item_w+'px;height:'+config.item_h+'px; }').appendTo('head');
	
	initDB(myDB.name,myDB.version);
	
	//颜色选择器
	$('#picker').colpick({
		onSubmit:setColor
    });
	
	function setColor(hsb, hex, rgb, el) {
		ff('pic').value = '#' + hex;
		$('#picker').colpickHide();
	}
	
	function getList(){
		var transaction=myDB.db.transaction(storeName,'readonly'); 
		var store=transaction.objectStore(storeName); 
		req = store.openCursor();
		var i = 0;
		var ii=0;
		$('table').html('');
		req.onsuccess = function(evt) {
		  var cursor = evt.target.result;
		  if (cursor) {
			var id = cursor.key;
			var title = cursor.value.title;
			var url = cursor.value.url;
			var icon = cursor.value.icon;
			if(i % config.cols == 0){
				ii++;
				$('table').append('<tr id=id'+ii+'></tr>');
			}
			if (icon != null && icon.length > 1 && icon.substring(0,1) == '#'){
				$('<td></td>').html('<a href="'+url+'"><div id="item'+id+'" class="item" style="background:'+icon+';"><p>编辑</p><p>'+title+'</p></div></a>').appendTo('#id'+ii);
			} else {
				$('<td></td>').html('<a href="'+url+'"><div id="item'+id+'" class="item" ><img style="width:100%;height:100%;" id="img'+id+ '" src="'+icon+'" onerror="onImageError();" alt="'+title+'"/></div></a>').appendTo('#id'+ii);
				ff('img'+id).onerror = onImageError;
			}
			i++;
			// Move to the next object in store
			cursor.continue();

		  } else {
			console.debug("No more entries!");
		  }
		};
	}
	
	//图片加载失败时用随机颜色替换，并显示名称
	function onImageError(){
		var img = event.srcElement;
		img.parentNode.style.background = getColor();
		img.parentNode.innerHTML=img.alt;
		img.onerror=null; //控制不要防止死循环
	}
	
	ff('pic').addEventListener('keyup', function(ev){
		var ev=ev || window.event;
		if(ev.keyCode==13){
			if (checkInput()){
				var url = ff('url').value;
				if (url.indexOf('http://') != 0 && url.indexOf('https://') != 0){
					url = 'http://'+url;
				}
				addList.push({title:ff('name').value, url, icon:ff('pic').value});
				addData();
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
	
	function addData(){
		if (addList == null || addList.length == 0){
			return false;
		}
		var tx = myDB.db.transaction(storeName, 'readwrite');
		var store = tx.objectStore(storeName);
		var d = addList.shift();
		var req = store.add(d);
		req.onsuccess = function (evt) {
		  console.debug("added successful:"+JSON.stringify(d));
		  if (addList.length > 0){
			  addData();
		  } else {
			  getList();
		  }
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
					var t = $(this).find('title').text();
					var u = $(this).find('url').text();
					var i = $(this).find('icon').text();
					if (t != '' && u != ''){
						addList.push({title:t, url:u, icon:i});
					}
				});
				addData();
			}
		});
	}
	
	//获取随机颜色值
	function getColor(){
	  return '#' + Math.floor((Math.random()*(0xFFFFFF<<0))).toString(16); //左移0位即可转为int，得到随机数再转为16进制
	}

});