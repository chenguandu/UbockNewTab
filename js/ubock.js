$(document).ready(function () {
    var ff = function (id) {
        return document.getElementById(id);
    }
	
    //调整webkit兼容性
    window.indexedDB = window.indexedDB || window.webkitIndexedDB;
    var init = false;
	//当前编辑项id
	var currentId = 0;
	//图片
	var blob;
	//背景图片
	var blobBack = undefined;
    var myDB = {
        name: 'ubock',
        version: 1,
        db: null
    };
	//默认设置
    var config = {
        cols: 4,
        item_w: 200,
        item_h: 113,
		bg:'../images/bg.png',
		bgBlob:undefined,
		bg_type:3,
		bg_scroll_type:0,
		show_search:true,
		top:50
    }
    var item = {
        title: null,
        url: null,
        icon: null
    }
    var storeName = 'bookmark';
    var addList = new Array();//等侍添加的列表，因为添加是异步的所以使用个列表来逐个添加，解决显示重复问题

    initDB(myDB.name, myDB.version);
	$('html').mousedown(menu);

    //颜色选择器
    $('#picker').colpick({
        onSubmit: setColor
    });
	
	$("#browser").click(function () {
		$("#upload").click(); //隐藏了input:file样式后
		$("#upload").on("change",function(){
			var temp = this.files[0];
			var size = temp.size;
			console.log("file size:"+size);
			if (size/1024 > 300){
				DJMask.alert("图片大小不能超过300KB", function () {});
				return false;
			}
			blob = temp;
			/* var objUrl = getObjectURL(blob) ; *///获取图片的路径,可用于预览，该路径不是图片在本地的路径
			$("#pic").val('file://'+blob.name);
		});
	});
	
	$("#browserBg").click(function () {
		$("#uploadBg").click(); //隐藏了input:file样式后
		$("#uploadBg").on("change",function(){
			var temp = this.files[0];
			var size = temp.size;
			console.log("file size:"+size);
			if (size/1024 > 1024){
				DJMask.alert("图片大小不能超过1MB", function () {});
				return false;
			}
			blobBack = temp;
			var objUrl = getObjectURL(blobBack) ;//获取图片的路径,可用于预览，该路径不是图片在本地的路径
			//$('<style></style>').html('.backgroundstyle{\nbackground:url("'+objUrl+'") no-repeat;\nbackground-size:100%;\n}').appendTo('head');
			//$('body').addClass('backgroundstyle');
			$('body').css({'background':'url("'+objUrl+'") no-repeat center center', 'background-size':'100% 100%','background-attachment':'fixed'});
			$("#background").val("file://"+blobBack.name);
		});
	});

    $("#addItem").on('click', saveData);
	
	$("#cancel").on('click', function(){
		//取消编辑清空id
		currentId = 0;
		ff('addItemCon').style.display = "none";
	});
	
	//执行保存设置
    $('#saveSettings').on('click', function(){
		saveSettings();
    });
	
	
    $('#cancelSettings').on('click', function(){
		blobBack = undefined;
		closeSettings();
    });
	
	$('#clear_settings').on('click', function(){
		DJMask.alert("确认要恢复默认设置吗？",deleteConfig, "恢复默认设置");
    });
	
	$('#clear_data').on('click', function(){
		DJMask.alert("确认要清除所有数据吗？",deleteData, "清除数据");
    });
	
	//恢复默认设置
	function deleteConfig(){
		var transaction = myDB.db.transaction('config', 'readwrite');
		var store = transaction.objectStore('config');
		var req = store.delete('config');
		req.onsuccess = function (evt) {
			DJMask.msg("恢复默认设置成功");
			window.location.href = "index.htm";
		};
		req.onerror = function (evt) {
			console.error("error", this.error);
			DJMask.alert("恢复默认设置失败");
		};
	}
	
	//清除所有数据，包括设置和添加的网站数据
	function deleteData(){
		var request = window.indexedDB.deleteDatabase(myDB.name);
		if (request){
			DJMask.msg("清除数据成功");
			window.location.href = "index.htm";
		} else {
			DJMask.alert("清除数据失败");
		}
	}
	
	//关闭设置
	function closeSettings(){
		$('.settingsCon').css({'display':'none'});
	}
	
	//保存设置
	function saveSettings(){
		var transaction = myDB.db.transaction('config', 'readwrite');
        var store = transaction.objectStore('config');
		var type = undefined;
		var bg = $('#background').val();
		config.bg = bg;
		if (bg.length > 7){
			type = bg.substring(0, 7);
		}
		if (type != undefined && type.toLowerCase() == 'file://'){
			if (blobBack){
				config.bgBlob = blobBack;
			}
		} else {
			config.bgBlob = undefined;
		}
		config.bg_type = $("input[name='bg_type']:checked").val();
		config.bg_scroll_type = $("input[name='bg_scroll_type']:checked").val();
		config.cols = $('#columns').val();
		config.item_w = $('#item_width').val();
		config.item_h = $('#item_height').val();
		config.top = $('#top').val();
		//$('#list').css({'margin-top':'"'+config.top+'px"'});
		ff('list').style.marginTop = config.top + "px";
		if ($("input[name='show_search']:checked").val() == 'true'){
			config.show_search = true;
		} else {
			config.show_search = false;
		}
        var req = store.put(config, 'config');
        req.onsuccess = function (evt) {
			if (config.show_search){
				ff('searchform').style.display="block";
			} else {
				ff('searchform').style.display="none";
			}
			console.log(config);
			DJMask.msg("保存成功");
        };
        req.onerror = function (evt) {
            console.error("error", this.error);
			DJMask.alert("保存失败");
        };
	}
	
	//blob对象转为图片的url
	function getObjectURL(file) {
		 var url = null ;
		 if (window.createObjectURL!=undefined) { // basic
			url = window.createObjectURL(file) ;
		 } else if (window.URL!=undefined) { // mozilla(firefox)
			url = window.URL.createObjectURL(file) ;
		 } else if (window.webkitURL!=undefined) { // webkit or chrome
			url = window.webkitURL.createObjectURL(file) ;
		 }
		 return url ;
	}

    function saveData() {
        if (checkInput()) {
            var url = ff('url').value;
            if (url.indexOf('http://') != 0 && url.indexOf('https://') != 0) {
                url = 'http://' + url;
            }
			var img = ff('pic').value;
			
			var type = undefined;
			var item = {title: ff('name').value, url, icon: img, blob};
			if (img.length > 7){
				type = img.substring(0, 7);
			}
			if (type != undefined && type.toLowerCase() == 'file://'){
				if (blob){
					item.blob = blob;
				}
			} else {
				item.blob = undefined;
			}
			
			if (currentId != 0){
				updateById($.extend({},item,{'id':currentId}));
			} else {
				addList.push(item);
				addData();
			}
        }
    }

    function setColor(hsb, hex, rgb, el) {
		blob = undefined;
        ff('pic').value = '#' + hex;
        $('#picker').colpickHide();
    }

    function getList() {
        var transaction = myDB.db.transaction(storeName, 'readonly');
        var store = transaction.objectStore(storeName);
        req = store.openCursor();
        var i = 0;
        var ii = 0;
        $('table').html('');
        req.onsuccess = function (evt) {
            var cursor = evt.target.result;
            if (cursor) {
                var id = cursor.key;
                var title = cursor.value.title;
                var url = cursor.value.url;
                var icon = cursor.value.icon;
				var img = cursor.value.blob;
				
				var file = true;
				var type = undefined;
				if (icon != undefined){
					if (icon.length > 7){
						type = icon.substring(0, 7);
					} else if (icon.length > 1){
						type = icon.substring(0, 1);
					}
				}
				if (type != undefined){
					if (type.toLowerCase() == 'file://'){
						icon = getObjectURL(img);
					} else if (type.toLowerCase() == '#'){
						file = false;
					}
				}
				
				
				
                if (i % config.cols == 0) {
                    ii++;
                    $('table').append('<tr id=id' + ii + '></tr>');
                }
                if (!file) {
                    $('<td></td>').html('<a id="con' + id + '" href="' + url + '"><div id="item' + id + '" class="item" style="background:' + icon + ';line-height:' + config.item_h + 'px;">' + title + '</p></div></a>').appendTo('#id' + ii);
                } else {
                    $('<td></td>').html('<a id="con' + id + '" href="' + url + '"><div id="item' + id + '" class="item"  style="line-height:' + config.item_h + 'px;"><img style="width:100%;height:100%;" id="imgs' + id + '" src="' + icon + '" onerror="onImageError();" alt="' + title + '"/></div></a>').appendTo('#id' + ii);
                    ff('imgs' + id).onerror = onImageError;
                }
				$('#item' + id).mousedown(menu);
                i++;
                // Move to the next object in store
                cursor.continue();

            } else {
                console.debug("No more entries!");
            }
        };
    }

    //图片加载失败时用随机颜色替换，并显示名称
    function onImageError() {
        var img = event.srcElement;
        img.parentNode.style.background = getColor();
        img.parentNode.innerHTML = img.alt;
        img.onerror = null; //控制不要防止死循环
    }

    ff('pic').addEventListener('keyup', function (ev) {
        var ev = ev || window.event;
        if (ev.keyCode == 13) {
            saveData();
        }
        ev.preventDefault();
    });

    function initDB(name, version) {
        var version = version || 1;
        var request = window.indexedDB.open(name, version);
        request.onerror = function (e) {
            console.log(e.currentTarget.error.message);
        };
        request.onsuccess = function (e) {
            myDB.db = e.target.result;
            onInit();
            console.log('DB init success, version = ' + version);
        };
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('config')) {
                db.createObjectStore('config');
            }
            if (!db.objectStoreNames.contains(storeName)) {
                var store = db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
            }
            console.log('DB version changed to ' + version);
        };
    }
	
	function initInfo(){
		$('<style></style>').html('td,td a div{width:' + config.item_w + 'px;height:' + config.item_h + 'px; }').appendTo('head');
		var bg = config.bg;
		var file = true;
		var type = undefined;
		if (bg != undefined){
			if (bg.length > 7){
				type = bg.substring(0, 7);
			} else if (bg.length > 1){
				type = bg.substring(0, 1);
			}
		}
		if (type != undefined){
			if (type.toLowerCase() == 'file://'){
				bg = getObjectURL(config.bgBlob);
			} else if (type.toLowerCase() == '#'){
				file = false;
			}
		}
		
		$('#background').val(config.bg);
		$('#columns').val(config.cols);
		$('#item_width').val(config.item_w);
		$('#item_height').val(config.item_h);
		$('#top').val(config.top);
		ff('list').style.marginTop = config.top + "px";
		document.getElementsByName('show_search')[0].checked = config.show_search;
		if (config.show_search){
			ff('searchform').style.display="block";
		} else {
			ff('searchform').style.display="none";
		}
		
		if (file){
			var bgStyle;
			var bgType;
			document.getElementsByName('bg_type')[config.bg_type].checked = true;
			document.getElementsByName('bg_scroll_type')[config.bg_scroll_type].checked = true;
			if (config.bg_type == 0){//背景平铺
				bgType = 'repeat';
			} else if (config.bg_type == 1){//背景水平平铺
				bgType = 'repeat-x';
			} else if (config.bg_type == 2){//背景垂直平铺
				bgType = 'repeat-y';
			} else if (config.bg_type == 3){//背景拉伸
				bgType = 'no-repeat';
			} else {
				bgType = 'repeat';
			}
			bgStyle = $.extend({},{},{'background':'url("'+bg+'") '+bgType+' center center'});
			if (config.bg_type == 3){
				bgStyle = $.extend({},bgStyle,{'background-size':'100% 100%'});
			}
			if (config.bg_scroll_type == 0){//背景固定
				bgStyle = $.extend({},bgStyle,{'background-attachment':'fixed'});
			} else {//背景随内容滚动
				bgStyle = $.extend({},bgStyle,{'background-attachment':'scroll'});
			}
			$('body').css(bgStyle);
		} else {
			ff("ubock").style.background = bg;
		}
	}

    function onInit() {
        init = true;
        var transaction = myDB.db.transaction('config', 'readwrite');
        var store = transaction.objectStore('config');
        var req = store.get('config');
        req.onsuccess = function (evt) {
            var conf = evt.target.result;
            if (conf == undefined) {//设置默认配置信息
                store.put(config, 'config');
            } else {
				config = conf;
				console.log(config);
			}
			initInfo();
			fetchList();
        };
        req.onerror = function (evt) {
            console.error("error", this.error);
			initInfo();
			fetchList();
        };
    }
	
	function fetchList(){
		var transaction = myDB.db.transaction(storeName, 'readwrite');
        var store = transaction.objectStore(storeName);
        var req = store.count();
        req.onsuccess = function (evt) {
            var count = evt.target.result;
            console.log('Totals:' + count);
            if (count == 0) {
                initData();
            } else {
                getList();
            }
        };
        req.onerror = function (evt) {
            console.error("error", this.error);
        };
	}

    function addData() {
        if (addList == null || addList.length == 0) {
            return false;
        }
        var tx = myDB.db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        var d = addList.shift();
        var req = store.add(d);
        req.onsuccess = function (evt) {
            console.debug("added successful:" + JSON.stringify(d));
            if (addList.length > 0) {
                addData();
            } else {
                getList();
            }
			clearEditor();
        };
        req.onerror = function () {
            console.error("add error", this.error);
        };
    }
	
	/**
     * 查询操作
     */
	function getById(id, callback){
            //根据存储空间的键找到对应数据
            var store = myDB.db.transaction(storeName,'readwrite').objectStore(storeName);
            var request = store.get(id);
            request.onerror = function(){
                console.error('getById error');
            };
            request.onsuccess = function(e){
                var result = e.target.result;
                console.log('查找数据成功')
				if (callback){
					callback(result);
				}
            };
        }

    /**
     * 修改操作
     */
    function updateById(params) {
        var transaction = myDB.db.transaction(storeName, "readwrite");
        var store = transaction.objectStore(storeName);
        var request = store.put(params);
        request.onsuccess = function () {
            console.log('修改成功');
			DJMask.msg('修改成功');
        };
        request.onerror = function (event) {
            DJMask.msg('修改失败');
        }
    };

    /**
     * 删除数据
     */
    function deleteById(id) {
        var store = myDB.db.transaction(storeName, "readwrite").objectStore(storeName);
        var request = store.delete(id)
        request.onsuccess = function () {
            console.log('删除成功');
			DJMask.msg('删除成功');
            var item = ff('con' + id);
            item.parentNode.removeChild(item);
        }
        request.onerror = function () {
            DJMask.msg("删除失败");
        };
    };

    function closeDB(db) {
        db.close();
    }

    function checkInput() {
        if (ff('name').value == '') {
            //alert('请输入名称');
            DJMask.alert("请输入名称", function () {
                ff('name').focus();
            }, "错误提示")
            /* DJMask.open({
                    width:"400px",
                    height:"auto",
                    title:"HHHHH",
                    content:'<div>请输入名称</div><a style="display:block;width:50px;height:25px;line-height:25px;text-align:center;border-radius:4px;background:#428bca;color:#fff;cursor:pointer;float:right;margin:5px;padding:0" class="dj-alert-ok">确定</a>'
                }); */
            return false;
        } else if (ff('url').value == '') {
            /* alert('请输入网址'); */
            DJMask.alert("请输入网址", function () {
                ff('url').focus();
            })
            return false;
        }
        return true;
    }

    function initData() {
        $.ajax({
            type: "GET",
            url: "default.xml",
            dataType: "xml",
            success: function (xml) {
                $(xml).find('bookmark').each(function () {
                    var t = $(this).find('title').text();
                    var u = $(this).find('url').text();
                    var i = $(this).find('icon').text();
                    if (t != '' && u != '') {
                        addList.push({title: t, url: u, icon: i});
                    }
                });
                addData();
            }
        });
    }

    //获取随机颜色值
    function getColor() {
        return '#' + Math.floor((Math.random() * (0xFFFFFF << 0))).toString(16); //左移0位即可转为int，得到随机数再转为16进制
    }
	
	//显示编辑区域
	function showEditor(title, url, icon){
		ff('addItemCon').style.display = "block";
		ff('name').value = title;
		ff('url').value = url;
		ff('pic').value = icon;
		window.location.href="#add" 
		ff('name').focus();
	}
	
	//隐藏编辑区域
	function hideEditor(){
		ff('addItemCon').style.display = "none";
	}
	
	//清空编辑区域内容
	function clearEditor(){
		ff('name').value = "";
		ff('url').value = "";
		ff('pic').value = "";
		blob = undefined;
	}

	//$("#TablebillList tbody tr").bind("mousedown", menu);
	function menu(e) {
        if (e.which == 3) {
			var item = e.target;
            var opertionn = {
                name: "menu",
                offsetX: 2,
                offsetY: 2,
                textLimit: 10,
                beforeShow: $.noop,
                afterShow: $.noop
            };

            var imageMenuData = [
                [{
                    text: "添加",
                    func: function () {
						currentId = 0;
						blob = undefined;
						$('.addItemTitle').html("添加");
                        showEditor('','','');
                    }
                }, {
                    text: "编辑",
                    func: function () {
						$('.addItemTitle').html("编辑");
                        currentId = parseInt(item.id.substr(4));
						console.log("current edit item id = " + currentId);
						getById(currentId, function(result){
							console.log(result);
							blob = result.blob;
							showEditor(result.title, result.url, result.icon);
						});
                    }
                }, {
                    text: "删除",
                    func: function () {
						var delId = parseInt(item.id.substr(4));
						//删除的是当前编辑项时关闭编辑区并清空内容
						if (currentId == delId){
							clearEditor();
							hideEditor();
						}							
						console.log("delete item id = " + delId);
						deleteById(delId);
                    }
                }, {
                    text: "设置",
                    func: function () {
						$('.settingsCon').attr('style','display:block');
                    }
                }, {
                    text: "关闭",
                    func: function () {}
                }]
            ];
			
			if (item.id == '' || item.id.length < 5 || (item.id.substring(0, 4) != "item" && item.id.substring(0, 4) != "imgs")){
				imageMenuData[0].splice(1,2);
			}
			//使用随机数确保每次右键弹出的菜单都不一样，否则取到的id会是同一个
			opertionn.name = "menu" + (Math.random() * 100000 + '').replace('.','');
			console.log(opertionn.name);
			
            $(this).smartMenu(imageMenuData, opertionn);
        }
    }
	
});