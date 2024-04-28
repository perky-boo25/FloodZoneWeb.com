console.clear();

let customFunction = function (url) {
  alert("opening window to visit " + url);
  window.open(url);
};

// define elements
let options = {
  container: "#container",
  zoom: "#zoomlevel",
  zoomIn: "#zoomin",
  zoomOut: "#zoomout",
  src: "edited.jpg",

  // from x, from y, to x, to y, title, url or function, ...any function arguments
  map: [
    [0, 0, 300, 300, "Reflect Digital", "https://www.reflectdigital.co.uk/"],
    [300, 0, 600, 300, "Bing", "https://www.bing.co.uk/"],
    [0, 300, 300, 600, "Yahoo", customFunction, "https://www.yahoo.co.uk/"]
  ]
};

let ZoomPan = function (options) {
  // options / customisables
  let zoomSteps = options.zoomSteps || 100,
    stepSize = options.stepSize || 10,
    wheelSize = options.wheelSize || options.stepSize || 10,
    maxImageScale = options.maxImageScale || 1,
    imageSrc = options.src,
    map = options.map || [],
    container = document.querySelector(options.container),
    zoom = document.querySelector(options.zoom),
    zoomIn = document.querySelector(options.zoomIn),
    zoomOut = document.querySelector(options.zoomOut);

  // automatics
  let containerWidth,
    containerHeight,
    containerRatio,
    minImageScale,
    imageScaleRange,
    imageScale = 1,
    imageTranslateX = 0,
    imageTranslateY = 0,
    focalPoint,
    displayFocalPoint;

  zoom.min = 0;
  zoom.max = zoomSteps;
  zoom.value = zoomSteps / 2;
  zoom.value = 0;

  // handle interaction results

  let loadUrl = function (url) {
    window.location.assign(url);
  };

  let triggerMapClick = function (i) {
    let call = loadUrl;
    let args = map[i].slice(5);
    if (typeof map[i][5] === "function") 
    {
      call = map[i][5];
      args = map[i].slice(6);
    }
    call.apply(this, args);
  };

  let naturaliseCoords = function (coords) {
    return {
      x: displayFocalPoint.x + (coords.x - containerWidth / 2) / imageScale,
      y: displayFocalPoint.y + (coords.y - containerHeight / 2) / imageScale
    };
  };

  let findMapMatch = function (coords) {
    for (let i in map) {
      if (
        map[i][0] < coords.x &&
        map[i][1] < coords.y &&
        map[i][2] > coords.x &&
        map[i][3] > coords.y
      ) {
        return i;
      }
    }
    return null;
  };

  let makeCoords = function (x, y) {
    return { x, y };
  };

  // handle events

  let dragging = false;
  let moved = false;

  let processClick = function (x, y) {
    let mapMatch = findMapMatch(naturaliseCoords(makeCoords(x, y)));
    if (mapMatch) {
      triggerMapClick(mapMatch);
    }
  };

  let hoverMatch = null;
  let handleMove = function (x, y, xMove, yMove) {
    let coords = naturaliseCoords(makeCoords(x, y));

    let mapMatch = findMapMatch(naturaliseCoords(makeCoords(x, y)));
    if (mapMatch !== null && mapMatch !== hoverMatch) {
      hoverMatch = mapMatch;
      image.style.cursor = "pointer";
      image.title = map[mapMatch][4];
    }

    if (mapMatch === null && hoverMatch !== null) {
      hoverMatch = null;
      image.style.cursor = "";
      image.title = "";
    }

    if (!dragging) {
      return;
    }

    focalPoint = { x: focalPoint.x - xMove, y: focalPoint.y - yMove };
    moved = true;

    positionImage();
  };

  let handleClick = function (e) {
    if (moved) {
      return;
    }
    processClick(e.clientX - e.target.x, e.clientY - e.target.y);
  };

  let handleMouseDown = function (e) {
    e.preventDefault();
    dragging = true;
    moved = false;
  };

  let handleMouseMove = function (e) {
    handleMove(e.clientX, e.clientY, e.movementX, e.movementY);
  };
  
  let handleMouseUp = function (e) {
    dragging = false;
    moved = false;
  };

  let handleTap = function (e) {
    processClick(
      e.touches[0].clientX - e.touches[0].target.x,
      e.touches[0].clientY - e.touches[0].target.y
    );
  };

  let lastTouch, touchStartEvent;
  let startPosition = {};
  let handleTouchStart = function (e) {
    touchStartEvent = e;
    startPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    startDrag(e);
  };
  
  let handleTouchMove = function (e) {
    let touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (!lastTouch) {
      lastTouch = { x: touch.x, y: touch.y };
    }
    handleMove(touch.x, touch.y, touch.x - lastTouch.x, touch.y - lastTouch.y);
    lastTouch = { x: touch.x, y: touch.y };
  };
  
  let handleTouchEnd = function (e) {
    lastTouch = null;
    if (!moved) {
      handleTap(touchStartEvent);
    }
    endDrag(e);
  };

  // position / size calculations

  let getContainerSize = function () {
    containerWidth = container.offsetWidth;
    containerHeight = container.offsetHeight;
    containerRatio = containerHeight / containerWidth;
  };

  let checkFocalPoint = function () {
    displayFocalPoint = { x: focalPoint.x, y: focalPoint.y };
    let xScaleWidth = image.naturalWidth * imageScale;
    let xScaleMargin = (image.naturalWidth - xScaleWidth) / 2;
    let xMax = xScaleMargin + xScaleWidth - containerWidth / 2;
    let xMin = xScaleMargin + containerWidth / 2;

    if (displayFocalPoint.x > xMax) displayFocalPoint.x = xMax;
    if (displayFocalPoint.x < xMin) displayFocalPoint.x = xMin;
    if (xScaleWidth < containerWidth) {
      displayFocalPoint.x = xScaleMargin + xScaleWidth / 2;
    }

    let yScaleHeight = image.naturalHeight * imageScale;
    let yScaleMargin = (image.naturalHeight - yScaleHeight) / 2;
    let yMax = yScaleMargin + yScaleHeight - containerHeight / 2;
    let yMin = yScaleMargin + containerHeight / 2;

    if (displayFocalPoint.y > yMax) displayFocalPoint.y = yMax;
    if (displayFocalPoint.y < yMin) displayFocalPoint.y = yMin;
    if (yScaleHeight < containerHeight) {
      displayFocalPoint.y = yScaleMargin + yScaleHeight / 2;
    }
    if (dragging) {
      focalPoint = displayFocalPoint;
    }
  };

  let positionImage = function () {
    checkFocalPoint();

    imageTranslateX =
      -(image.naturalWidth - containerWidth) / 2 -
      (displayFocalPoint.x - image.naturalWidth / 2);
    imageTranslateY =
      -(image.naturalHeight - containerHeight) / 2 -
      (displayFocalPoint.y - image.naturalHeight / 2);

    updateStyles();
  };

  let sizeImage = function () {
    if (!focalPoint) {
      return;
    }
    if (containerRatio > imageRatio) {
      minImageScale = containerWidth / image.naturalWidth;
    } else {
      minImageScale = containerHeight / image.naturalHeight;
    }
    if (imageScale === 1) {
      let aspectRatio = image.naturalWidth / image.naturalHeight;
      if (containerWidth / containerHeight > aspectRatio) {
        imageScale = containerHeight / image.naturalHeight;
      } else {
        imageScale = containerWidth / image.naturalWidth;
      }
    }
    imageScale =
      minImageScale +
      ((maxImageScale - minImageScale) / zoomSteps) * zoom.value;

    positionImage();
  };
  
  let updateStyles = function () {
    image.style.transform = `translateX(${imageTranslateX}px) translateY(${imageTranslateY}px) scale(${imageScale})`;
  };

  let updateZoom = function () {
    sizeImage();
  };

  // init

  let setupImage = function () {
    container.appendChild(image);
    imageRatio = image.naturalHeight / image.naturalWidth;
    focalPoint = { x: image.naturalWidth / 2, y: image.naturalHeight / 2 };
    sizeImage();
    image.addEventListener("click", handleClick);
    image.addEventListener("mousedown", handleMouseDown);
    image.addEventListener("mousemove", handleMouseMove);
    image.addEventListener("mouseup", handleMouseUp);
    image.addEventListener("touchstart", handleTouchStart);
    image.addEventListener("touchmove", handleTouchMove);
    image.addEventListener("touchend", handleTouchEnd);
  };

  window.addEventListener("resize", function () {
    getContainerSize();
    sizeImage();
  });

  zoom.addEventListener("input", updateZoom);
  zoom.addEventListener("change", updateZoom);

  zoomIn.addEventListener("click", function () {
    zoom.value = parseInt(zoom.value) + stepSize;
    updateZoom();
  });

  zoomOut.addEventListener("click", function () {
    zoom.value = parseInt(zoom.value) - stepSize;
    updateZoom();
  });

  container.addEventListener("wheel", function (e) {
    e.preventDefault();
    zoom.value =
      parseInt(zoom.value) - (e.deltaY / Math.abs(e.deltaY)) * wheelSize;
    updateZoom();
  });
  
  let imageRatio;
  let image = new Image();
  image.onload = setupImage;
  image.src = imageSrc;

  getContainerSize();
};

ZoomPan(options);

!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src='https://weatherwidget.io/js/widget.min.js';fjs.parentNode.insertBefore(js,fjs);}}(document,'script','weatherwidget-io-js');

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}