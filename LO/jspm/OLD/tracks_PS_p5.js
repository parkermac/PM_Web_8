// BEGIN statements to choose which domain

// full domain
// let tfile = 'tracks_full.json';
// let lon0 = -131,
//   lon1 = -121;
// let lat0 = 42,
//   lat1 = 52;

// PugetSound
let tfile = 'tracks_PS.json';
let lon0 = -124,
  lon1 = -122;
let lat0 = 47,
  lat1 = 49.2;

// ENDstatements to choose which domain

let dlon = lon1 - lon0;
let dlat = lat1 - lat0;
let clat = Math.cos(Math.PI * (lat0 + lat1) / (2 * 180));
let hfac = dlat / (dlon * clat);
let w, h, TR, CC;
let XX, YY, XX0, YY0, CX, CY;

function preload() {
  TR = loadJSON('tracks/' + tfile);
  CC = loadJSON('tracks/coast_xy.json');
}

function setup() {
  frameRate(24);
  w, h = getWh();
  let C = createCanvas(w, h);
  C.parent("myDiv")
  XX, YY, XX0, YY0 = getLines();
  CX, CY = getCoast();
  noLoop();

}

function draw() {
  w,
  h = getWh();

  // redrawing the background ereases earlier lines
  background(230);

  // mark all drifter release locations
  for (let p in XX0) {
    fill('orange');
    strokeWeight(0);
    circle(XX0[p], YY0[p], 3)
  }

  // put a circle where the cursor is
  fill('rgba(10, 20, 200, .5)');
  strokeWeight(0);
  circle(mouseX, mouseY, w / 30);

  // draw drifter tracks for those released near the cursor
  let dx, dy, dr2, c, ntr, ii;
  for (let p in XX) {
    dx = mouseX - XX0[p];
    dy = mouseY - YY0[p];
    dr2 = dx * dx + dy * dy;
    if (dr2 < w * w / (50 * 50)) {
      xtr = XX[p];
      ytr = YY[p];
      ntr = xtr.length;
      for (let i = 0; i < xtr.length - 1; i++) {
        strokeWeight(1 + i / (ntr / 3));
        ii = floor(255 * i / ntr);
        c = color(ii, 0, 255 - ii);
        stroke(c)
        line(xtr[i], ytr[i], xtr[i + 1], ytr[i + 1]);
      }
    }
  }

  // draw coast
  let nc, xc, yc;
  for (let p in CX) {
    xc = CX[p];
    yc = CY[p];
    nc = xc.length;
    for (let i = 0; i < nc - 1; i++) {
      strokeWeight(.3);
      stroke(0)
      line(xc[i], yc[i], xc[i + 1], yc[i + 1]);
    }
  }

}

function getLines() {
  // This converts all drifter tracks to canvas coordinates,
  // and stores them as arrays in objects: XX, YY.
  // It also makes objects with just the release locations: XX0, YY0.
  XX = {};
  YY = {};
  XX0 = {};
  YY0 = {};
  let x, y, xx, yy, tr, xtr, ytr;
  w, h = getWh();
  let xscl = w / (lon1 - lon0);
  let yscl = h / (lat1 - lat0);
  for (let p in TR) {
    tr = TR[p];
    x = tr.x;
    y = tr.y;
    xtr = [];
    ytr = [];
    for (let i = 0; i < x.length; i++) {
      xx = xscl * (x[i] - lon0);
      yy = h - yscl * (y[i] - lat0);
      xtr.push(xx);
      ytr.push(yy);
    }
    XX[p] = xtr;
    YY[p] = ytr;
    XX0[p] = xtr[0];
    YY0[p] = ytr[0];
  }
  return XX, YY, XX0, YY0;
}

function getCoast() {
  // This converts the coastline to canvas coordinates,
  // and stores it as arrays in objects: CX, CY.
  CX = {};
  CY = {};
  let x, y, xx, yx, cc, xc, yc;
  w, h = getWh();
  let xscl = w / (lon1 - lon0);
  let yscl = h / (lat1 - lat0);
  for (let p in CC) {
    cc = CC[p];
    x = cc.x;
    y = cc.y;
    xc = [];
    yc = [];
    for (let i = 0; i < x.length; i++) {
      xx = xscl * (x[i] - lon0);
      yy = h - yscl * (y[i] - lat0);
      xc.push(xx);
      yc.push(yy);
    }
    CX[p] = xc;
    CY[p] = yc;
  }
  return CX, CY;
}

function mousePressed() {
  // only draw when touching, or when mouse is pressed
  loop();
}

function mouseReleased() {
  // otherwise stop drawing
  noLoop();
}

function windowResized() {
  // this is an OK way to handle responsive design
  w,
  h = getWh();
  resizeCanvas(w, h);
}

function getWh() {
  // Get the canvas size based on the div width.
  // For some reason I need the "14" to mimic the padding I
  // use in the "left" style.
  w = select('#myDiv').width - 14;
  h = hfac * w;
  return w, h
}
