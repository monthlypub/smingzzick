var myApp = angular.module('myApp', ['ngAnimate', 'ngSanitize','ui.bootstrap']);
// var myApp = angular.module('myApp', ['ui.bootstrap']);
var dataRoot, modalRoot;

function BuildInfo () {
  this.time = new Date();
  this.galleryInfo = null;
  this.title = null;
  this.smingTitle = null;
  this.smingLink = null;
  this.sid = [];
}

function BuildInfo (time, title) {
  this.time = time;
  this.title = title;

  this.galleryInfo = null;
  this.smingTitle = null;
  this.smingLink = null;
  this.sid = [];

  this.toString = function() {
    var timeText = this.time.getHours() + ":" + this.time.getMinutes();
    
    if (!this.galleryInfo) {
      return "";
    }

    var galleryText;
    if (this.galleryInfo.is_minor) {
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
        return item.text;
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

    $scope.songList = [];
    $scope.songSelected;
    $scope.modalInstance;

    $scope.default = {
      "term" : 10,
      "title" : null
    };

    $scope.buildInfos = [];
    $scope.copyTemp = "";

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
        return;
      }

      var textToCopy = textArray.join("\n\n");
      $scope.copyTemp = textToCopy;

      var clipboard = new Clipboard('#btn_copy');
      clipboard.on('success', function(e) {
        alert('클립보드에 복사되었습니다.');
        $scope.copyTemp = "";
      });

      clipboard.on('error', function(e) {
          $scope.copyTemp = "";
      });


    };

    $scope.exportImage = function() {
      alert("아직 만들고 있음");
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
                  return {
                    'name' : gallery.ko_name + " 갤러리",
                    "id" : gallery.name,
                    "is_minor" : false
                  }
                }
            );
          }
          if (data['1']) {
            minorGalleryInfo = data['1'].map(
                function (gallery) {
                  return {
                    'name' : gallery.m_ko_name + " 마이너 갤러리",
                    "id" : gallery.name,
                    "is_minor" : true
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

    $ctrl.songList = dataRoot = Object.values(data);
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


  $ctrl.save = function () {
    if (!$ctrl.song) {
      $ctrl.song = {
        "artist": "아티스트 모름",
        "title": "M:" + $ctrl.MSID +  "...",
        "melon": $ctrl.MSID,
        "genie":null,
        "bugs":null,
        "naver":null,
        "text":""
      };
    }

    $ctrl.song.melon = $ctrl.MSID;
    $ctrl.song.genie = $ctrl.GSID;
    $ctrl.song.bugs = $ctrl.BSID;
    $ctrl.song.naver = $ctrl.NSID;

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

