var myApp = angular.module('myApp', ['ngAnimate', 'ngSanitize','ui.bootstrap']);
myApp.config( [
  '$compileProvider',
  function( $compileProvider )
  {   
      $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|szzick|intent):/);
      // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
  }
]);
// var myApp = angular.module('myApp', ['ui.bootstrap']);
var dataRoot, modalRoot;

function BuildInfo (time, title, obj) {
  if (obj) {
    this.time = new Date(obj.time);
    this.galleryInfo = obj.galleryInfo;
    this.title = obj.title;
    this.smingTitle = obj.smingTitle;
    this.smingLink = obj.smingLink;
    this.sid = obj.sid;
  } else {
    this.time = time;
    this.title = title;

    this.galleryInfo = null;
    this.smingTitle = null;
    this.smingLink = null;
    this.sid = [];
  }

  this.toImageString = function() {
    if (!this.galleryInfo) {
      return "";
    }

    var timeText = this.time.getHours() + ":" + this.time.getMinutes() + "   " + this.galleryInfo.name;

    var titleText = "제목 : ";
    if (this.title) {
      titleText += this.title;
    } else {
      titleText += "미정";
    }

    var smingText = "스밍 : ";
    if (this.smingTitle) {
      smingText += this.smingTitle;
    } else {
      smingText += "미정";
    }

    var allText = [timeText, titleText, smingText].join("\n");

    return allText;
  };

  this.toString = function() {    
    if ((!this.galleryInfo || !this.galleryInfo.id) && !this.galleryInfo.url)  {
      return "";
    }

    var timeText = this.time.getHours() + ":" + this.time.getMinutes();
    // var galleryName = this.galleryInfo.name_src;
    // timeText += " " + galleryName.split("").join("/");

    var galleryText;
    if (this.galleryInfo.url) {
      galleryText = this.galleryInfo.url;
    } else if (this.galleryInfo.is_minor) {
      galleryText = "http://gall.dcinside.com/mgallery/board/lists/?id=" + this.galleryInfo.id;
    } else {
      galleryText = "http://gall.dcinside.com/board/lists/?id=" + this.galleryInfo.id;
    }

    var titleText = "총공명 : ";
    if (this.title) {
      titleText += this.title;
    } else {
      titleText += "미정";
    }

    var smingText = "스밍 : ";
    if (this.smingTitle) {
      smingText += this.smingTitle;
    } else {
      smingText += "미정";
    }
    if (this.smingLink) {
      smingText += " " + this.smingLink;
    }

    var sidText = this.sid.map(
      function (item) {
        return item.text ? item.text : sidToText(item);
      }
    ).join("\n");

    var allText = [timeText, galleryText, titleText, smingText].join("\n");
    if (sidText) {
      allText = [allText, sidText].join("\n");
    }


    return allText;
  }
}


myApp.controller('MainCtrl', ['$scope', '$http', '$sce', '$uibModal', '$document', function ($scope, $http, $sce, $uibModal, $document) {
    $ctrl = this;
    $scope.getYMD = function() {
        var d = new Date();
        var mm = d.getMonth() + 1; // getMonth() is zero-based
        var dd = d.getDate();

        return [d.getFullYear(),
                (mm>9 ? '' : '0') + mm,
                (dd>9 ? '' : '0') + dd
              ].join('');

    }

    $scope.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") >= 0;

    $scope.songList = [];
    $scope.songSelected;
    $scope.modalInstance;

    $scope.default = loadDefaultInfo();
    $scope.loadRawJson = function (json) {
      json.forEach(
        function(j) {
          if (j && j.sid && j.sid.length > 0) {
            j.sid.forEach(
              function(s) {
                if (s.melon) {
                  s["title"] = "M : " + s.melon + "...";
                }
              }
            )
          }
          if (j && j.galleryInfo && j.galleryInfo.name_src) {
            j.galleryInfo["url"] = j.galleryInfo.name_src
            j.galleryInfo["name"] = j.galleryInfo.name_src
          }
        }
      )
      for (var index in json) {
        json[index]  = new BuildInfo(null, null, json[index]);
      }
    
      $scope.buildInfos = json;
    }
  
    var paramQuery = parse_query_string(location.search);
    var paramHash = location.hash;
    if (paramQuery && paramQuery.hasOwnProperty("json")) {
      try {
        var json = JSON.parse(paramQuery.json);
        $scope.loadRawJson(json);
      } catch(e) {
        console.log(e)
        $scope.buildInfos = loadBuildInfos();  
      }
    } else if (paramHash) {
      try {
        var json = JSON.parse(decodeURIComponent(paramHash.substr(1)));
        $scope.loadRawJson(json);
      } catch(e) {
        console.log(e)
        $scope.buildInfos = loadBuildInfos();  
      }
    } else {
      $scope.buildInfos = loadBuildInfos();
    }
    

    $scope.copyTemp = "";
    $scope.deepLinkTemp = "";

    var defaultChangeTimer, buildInfoChangeTimer;

    $scope.$watch('buildInfos', 
      function(newVal, oldVal) {
        if (buildInfoChangeTimer) {
          clearTimeout(buildInfoChangeTimer);
        }

        buildInfoChangeTimer = setTimeout(
          function () {
            saveBuildInfos($scope.buildInfos);
          }
        ,1000);
      }
    , true);

    $scope.$watch('default', 
      function(newVal, oldVal) {
        if (defaultChangeTimer) {
          clearTimeout(defaultChangeTimer);
        }

        defaultChangeTimer = setTimeout(
          function () {
            saveDefaultInfo($scope.default);
          }
        ,1000);
      }
    , true);


    function getLatestTime() {

      var latest = null;
      for (index in $scope.buildInfos) {
        if (latest == null || latest < $scope.buildInfos[index].time) {
          latest = $scope.buildInfos[index].time;
        }
      }

      if (latest == null) {
        return new Date().getTime();
      } else {
        return latest.getTime();
      }

    }

    $scope.exportCopy = function() {
      var textArray = $scope.buildInfos.map(
        function(item) {
          return item.toString();
        }
      ).filter(function (value) {return value});

      if (textArray.length == 0) {
        alert('최소 하나 이상의 총공을 넣어주세요.\n갤러리 지정 필수입니다.');
        return;
      }

      var textToCopy = textArray.join("\n\n");
      $scope.copyTemp = textToCopy;

      var clipboard = new Clipboard('#btn_copy');
      clipboard.on('success', function(e) {
        alert('클립보드에 복사되었습니다.');
        $scope.copyTemp = "";

        e.clearSelection();
        clipboard.destroy();
      });

      clipboard.on('error', function(e) {
          $scope.copyTemp = "";
          clipboard.destroy();
      });


    };

    $scope.exportHref = function() {
      var textArray = $scope.buildInfos.map(
        function(item) {
          return item.toString();
        }
      ).filter(function (value) {return value});

      if (textArray.length == 0) {
        alert('최소 하나 이상의 총공을 넣어주세요.\n갤러리 지정 필수입니다.');
        return false;
      }

      var textToDeepLink = textArray.join("\n\n");
      $scope.deepLinkTemp = encodeURI(textToDeepLink);

      return true;
    };

    $scope.exportImage = function() {
      var textArray = $scope.buildInfos.map(
        function(item) {
          return item.toImageString();
        }
      ).filter(function (value) {return value});

      if (textArray.length == 0) {
        return;
      }

      var allArray = [];
      for (var index in textArray) {
        if (allArray.length) {
          allArray.push(" ");
        }
        allArray = allArray.concat(textArray[index].split("\n"));
      }

      var canvas = document.getElementById("myCanvas");
      var ctx = canvas.getContext("2d");

      var fontSize = 21;
      var canvasHeightOffset = fontSize + 5;
      var canvasWidthOffset = 5;


      canvas.height = allArray.length * (fontSize * 1.6) + fontSize;
 
      ctx.fillStyle="white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fontSize + "px Arial";
      ctx.fillStyle = 'black';

      for (var index in allArray) {
        ctx.fillText(allArray[index], canvasHeightOffset ,canvasHeightOffset + index * (fontSize * 1.6));
      }

      document.getElementById("downloadLink").href = canvas.toDataURL('image/jpeg');
    };

    $scope.onSIDAdd = function (buildInfo) {
        $scope.openSIDModal(buildInfo);
    };

    $scope.onSIDEdit = function (buildInfo, $index) {
        $scope.openSIDModal(buildInfo, buildInfo.sid[$index]);
    };


    $scope.onSIDDelete = function (buildInfo, $index) {
        buildInfo.sid.splice($index, 1);
    };


    $scope.onLinkInput = function (buildInfo) {
        $scope.openLinkModal(buildInfo);
    };

    $scope.onAdd = function() {
      $scope.buildInfos.push(
        new BuildInfo(new Date(getLatestTime() + $scope.default.term * 60 * 1000), $scope.default.title));
    };

    $scope.onRemove = function ($index) {
      if (confirm('총공 정보 하나를 지우겠습니까?')) {
        $scope.buildInfos.splice($index, 1);
      }
    };

    $scope.onGallerySelected = function ($item, buildInfo) {
        buildInfo.galleryInfo = $item;
    };

    $scope.onGalleryNameChanged = function (buildInfo) {
      if (buildInfo.galleryInfo && buildInfo.galleryInfo.id && buildInfo.galleryInfo.name !== buildInfo.galleryInfo.name_src) {
        delete buildInfo["galleryInfo"]; 
      }
    };


    $scope.getGallery = function getGallery(keyword) {
      var url = 'http://search.dcinside.com/autocomplete?callback=JSON_CALLBACK&k=' + keyword;
      $sce.trustAsResourceUrl(url)
      
      return $http.jsonp(url, {jsonpCallbackParam: 'callback'}).then(
        function(response){
          var data = response.data;

          var majorGalleryInfo = [];
          var minorGalleryInfo = [];
          if (data['0']) {
            majorGalleryInfo = data['0'].map(
                function (gallery) {
                  var name = gallery.ko_name + " 갤러리";
                  return {
                    'name' : name,
                    "name_src" : name,
                    "id" : gallery.name,
                    "is_minor" : false,
                    "url" : "http://gall.dcinside.com/board/lists/?id=" + gallery.name
                  }
                }
            );
          }
          if (data['1']) {
            minorGalleryInfo = data['1'].map(
                function (gallery) {
                  var name = gallery.m_ko_name + " 마이너 갤러리";
                  return {
                    'name' : name,
                    "name_src" : name,
                    "id" : gallery.name,
                    "is_minor" : true,
                    "url" : "http://gall.dcinside.com/mgallery/board/lists/?id=" + gallery.name
                  }
                }
            );
          }

          var galleryInfo = majorGalleryInfo.concat(minorGalleryInfo);
          return galleryInfo;
      },function(response){
        console.log(response);
      });
    };

    // $scope.getGallery = function(keyword) {
    //   getGallery($http, keyword)
    // }


    $scope.openSIDModal = function (buildInfo, song, parentSelector) {
        var parentElem = parentSelector ? 
          angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
        var modalInstance = $uibModal.open({
          animation: $ctrl.animationsEnabled,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'sidModalContent.html',
          controller: 'ModalSIDInstanceCtrl',
          controllerAs: '$ctrl',
          size: 'lg', 
          appendTo: parentElem,
          resolve: {
            $http: function () {
              return  $http;
            },
            song: function() {
              return song;
            }
          }
        });

        modalInstance.result.then(
          function(resultSong) {
            console.log(resultSong);

            if (!song) {
              buildInfo.sid.push(resultSong);
            }
          }
        );

    };

    $scope.openLinkModal = function (buildInfo, parentSelector) {
        var parentElem = parentSelector ? 
          angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
        var modalInstance = $uibModal.open({
          animation: $ctrl.animationsEnabled,
          ariaLabelledBy: 'modal-title',
          ariaDescribedBy: 'modal-body',
          templateUrl: 'linkModalContent.html',
          controller: 'ModalLinkInstanceCtrl',
          controllerAs: '$ctrl',
          size: 'lg', 
          appendTo: parentElem,
          resolve: {
            // link : buildInfo.smingLink
            link : function () {
              return buildInfo.smingLink;
            }
          }
        });

        modalInstance.result.then(
          function(link) {
            buildInfo.smingLink = link;
          }
        );
    };
}]);

function loadList($http, $ctrl) {
  $http({
    method: 'GET',
    url: 'https://sming-2ea90.firebaseio.com/song.json'
  }).success(function (data, status, headers, config) {
    console.log("STATUS : " + status);
    console.log("DATA : " + data);

//    $ctrl.songList = dataRoot = Object.values(data);
    $ctrl.songList = Object.keys(data).map(function(key){return data[key];});
  })
  .error(function (data, status, headers, config) {
  });
}

function getGallery($http, keyword) {
    return $http.get('http://search.dcinside.com/autocomplete', {
      params: {
        callback: '',
        k: keyword
      },
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    }).then(function(response){
      return response.data.results.map(function(item){
        return item.formatted_address;
      });
    });
  };



var songRoot;
var clipRoot;
myApp.controller('ModalSIDInstanceCtrl', function ($uibModalInstance, $http, song) {
  var $ctrl = this;
  // $ctrl.song = songRoot = song;
  $ctrl.isAdd = !song;
  $ctrl.sidModalTitle = !$ctrl.isAdd ? 'SID 편집' : 'SID 추가';
  $ctrl.song = song;
  $ctrl.songSelected = song;

  $ctrl.MSID = song && song.melon ? song.melon : null;
  $ctrl.GSID = song && song.genie ? song.genie : null;
  $ctrl.BSID = song && song.bugs ? song.bugs : null;
  $ctrl.NSID = song && song.naver ? song.naver : null;
  $ctrl.YSID = song && song.youtube ? song.youtube : null;



  $ctrl.save = function () {
    if (!$ctrl.song) {
      $ctrl.song = {
        "artist": "아티스트 모름",
        "title": "M:" + $ctrl.MSID +  "...",
        "melon": $ctrl.MSID,
        "genie":null,
        "bugs":null,
        "naver":null,
        "youtube":null,
        "text":""
      };
    }

    $ctrl.song.melon = $ctrl.MSID;
    $ctrl.song.genie = $ctrl.GSID;
    $ctrl.song.bugs = $ctrl.BSID;
    $ctrl.song.naver = $ctrl.NSID;
    $ctrl.song.youtube = $ctrl.YSID;

    var textArray = [];
    if ($ctrl.MSID) {
      textArray.push("M:" + $ctrl.MSID);
    }
    if ($ctrl.GSID) {
      textArray.push("G:" + $ctrl.GSID);
    }
    if ($ctrl.BSID) {
      textArray.push("B:" + $ctrl.BSID);
    }
    if ($ctrl.NSID) {
      textArray.push("N:" + $ctrl.NSID);
    }
    if ($ctrl.YSID) {
      textArray.push("Y:" + $ctrl.YSID);
    }


    $ctrl.song.text = "SID " + textArray.join("|");

    $uibModalInstance.close($ctrl.song);
  };

  $ctrl.close = function () {
    $uibModalInstance.dismiss('cancel');
  };

  // $ctrl.goLink = function (item) {
  //   window.open(item.link);
  // }

  $ctrl.onSongSelect = function ($item, $model, $label) {
    console.log($item);

    $ctrl.song = $item;

    $ctrl.MSID = $item.melon ? $item.melon[0] : null;
    $ctrl.GSID = $item.genie ? $item.genie[0] : null;
    $ctrl.BSID = $item.bugs ? $item.bugs[0] : null;
    $ctrl.NSID = $item.naver ? $item.naver[0] : null;
    $ctrl.YSID = $item.youtube ? $item.youtube[0] : null;
  }


  loadList($http, $ctrl);
});

myApp.controller('ModalLinkInstanceCtrl', function ($uibModalInstance, link) {
  var $ctrl = this;
  $ctrl.link = link;


  $ctrl.save = function () {
    $uibModalInstance.close($ctrl.link);
  }

  $ctrl.close = function () {
    $uibModalInstance.dismiss('cancel');
  };



  // $ctrl.goLink = function (item) {
  //   window.open(item.link);
  // }
});

function sidToText(sid) {
  var textArray = [];
  if (sid.melon) {
    textArray.push("M:" + sid.melon);
  }
  if (sid.genie) {
    textArray.push("G:" + sid.genie);
  }
  if (sid.bugs) {
    textArray.push("B:" + sid.bugs);
  }
  if (sid.naver) {
    textArray.push("N:" + sid.naver);
  }
  if (sid.youtube) {
    textArray.push("Y:" + sid.youtube);
  }


  return "SID " + textArray.join("|");
}

function saveBuildInfos(buildInfos) {
  localStorage.setItem('BUILD_INFO', JSON.stringify(buildInfos));
}

function loadBuildInfos() {
  if (!localStorage.getItem('BUILD_INFO')) {
    return [];
  }

  var buildInfos = JSON.parse(localStorage.getItem('BUILD_INFO'));
  for (var index in buildInfos) {
    buildInfos[index]  = new BuildInfo(null, null, buildInfos[index]);
  }

  return buildInfos;
}

function saveDefaultInfo(defaultInfo) {
  localStorage.setItem('DEFAULT_INFO', JSON.stringify(defaultInfo));
}

function loadDefaultInfo() {
  if (!localStorage.getItem('DEFAULT_INFO')) {
    return {
      "term" : 10,
      "title" : null
    };
  }
  return JSON.parse(localStorage.getItem('DEFAULT_INFO'));
}

function parse_query_string(query) {
  if (query.indexOf("?") == 0) {
    query = query.substr(1);
  }
  var vars = query.split("&");
  var query_string = {};
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    var key = decodeURIComponent(pair[0]);
    var value = decodeURIComponent(pair[1]);
    // If first entry with this name
    if (typeof query_string[key] === "undefined") {
      query_string[key] = decodeURIComponent(value);
      // If second entry with this name
    } else if (typeof query_string[key] === "string") {
      var arr = [query_string[key], decodeURIComponent(value)];
      query_string[key] = arr;
      // If third or later entry with this name
    } else {
      query_string[key].push(decodeURIComponent(value));
    }
  }
  return query_string;
}
