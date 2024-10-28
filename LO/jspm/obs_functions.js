// Functions for obs.js.

let margin = 30;

let map_info = {}
function make_map_info() {
    // Define the geographical range of the MAP and its aspect ratio.
    let lon0 = -130, lon1 = -122, lat0 = 42, lat1 = 52;
    let dlon = lon1 - lon0;
    let dlat = lat1 - lat0;
    let clat = Math.cos(Math.PI * (lat0 + lat1) / (2 * 180));
    let hfac = dlat / (dlon * clat);
    // Define the size of the map svg.
    let w0 = 460 - 2 * margin; // width for the map
    let h0 = w0 * hfac; // height for the map
    // Create the svg for the map
    map_info = {
        x0: lon0, x1: lon1,
        y0: lat0, y1: lat1,
        w0: w0, h0: h0
    };
}

function make_svg(this_info, axid, labelText) {
    // Create an svg with axes specific to a pair of variables, e.g.
    // lon,lat for the map or fld,z for a variable (in the object "this_info").
    // Assigns the svg to id=axid.
    let width = this_info.w0 + 2 * margin;
    let height = this_info.h0 + 2 * margin;
    // Declare the x (horizontal position) scale.
    const x = d3.scaleLinear()
        .domain([this_info.x0, this_info.x1])
        .range([margin, width - margin]);
    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([this_info.y0, this_info.y1])
        .range([height - margin, margin]);
    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('id', axid);
    // make the container visible
    svg.append("g")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke", "none")
        .attr("stroke-width", 2 * margin)
        .attr("opacity", .3);
    // Add the x-axis.
    svg.append("g") // NOTE: the svg "g" element groups things together.
        .attr("transform", `translate(0,${height - margin})`)
        .call(d3.axisBottom(x).ticks(3));
    // Add the y-axis.
    svg.append("g")
        .attr("transform", `translate(${margin},0)`)
        .call(d3.axisLeft(y).ticks(5));
    // Add the text.
    svg.append('g')
        .append('text')
        .attr('x', margin * 2)
        .attr('y', margin * 3)
        .text(labelText);
    return svg
}

// Function to convert from x and y to svg coordinates.
function scaleData(x, y, this_info) {
    var height = this_info.h0 + 2 * margin;
    var dx = this_info.x1 - this_info.x0;
    var dy = this_info.y1 - this_info.y0;
    var xscl = this_info.w0 / dx;
    var yscl = this_info.h0 / dy;
    // var sx, sy;
    sx = margin + xscl * (x - this_info.x0);
    sy = height - margin - yscl * (y - this_info.y0);

    return [sx, sy];
}

// COASTLINE Function

function add_coastline(coastfile, which_svg, map_info) {
    // Get the coast line segments. We need the Object.values() method here
    // because the floats in coast are packed as strings in the json.
    coastVal = Object.values(coastfile);
    let nCoast = coastVal.length;
    // Save the coastline as a list of lists in the format
    // [ [ [x,y], [x,y], ...], [], ...]
    // where each item in the list is one segment, packed as a list of [x,y] points.
    let cxy = [];
    for (let s = 0; s < nCoast; s++) {
        // pull out a single segment and scale
        var cx = coastVal[s].x;
        var cy = coastVal[s].y;
        var csxy = [];
        var sxy; // [sx, sy] from scaleData()
        for (let i = 0; i < cx.length; i++) {
            sxy = scaleData(cx[i], cy[i], map_info);
            csxy.push(sxy);
        }
        cxy.push(csxy);
    }
    // Loop over all the coast segments and plot them, one line per segment.
    for (let j = 0; j < nCoast; j++) {
        which_svg.append("path")
            .attr("d", d3.line()(cxy[j]))
            .attr("stroke", "black")
            .attr("fill", "none")
            .attr("opacity", 1.0);
    }
}

// DATA Functions

// Get the obs INFO which looks like: {"lon":{"0":-122.917,"1":-122.708,...
// Here we do not need the Object.values() method because the floats are
// already numbers.
// The resulting lists will have one entry per cast.
let cid_list = [];
let lon_list = [];
let lat_list = [];
let time_list = [];
let time_obj = {};
let icxy = {};
function make_info(obs_info, map_info) {
    for (const [key, value] of Object.entries(obs_info.cid)) {
        cid_list.push(value);
    }
    for (const [key, value] of Object.entries(obs_info.lon)) {
        // cid_list.push(key);
        lon_list.push(value);
    }
    for (const [key, value] of Object.entries(obs_info.lat)) {
        lat_list.push(value);
    }
    for (const [key, value] of Object.entries(obs_info.time)) {
        time_list.push(new Date(value).getMonth() + 1);
        // time_list will be month (1-12)
    }
    let ncid = cid_list.length;
    // Save the scaled station locations as an object (dict) with format:
    // { cid0: [x,y], cid1: [x,y], ...}
    // where each item in the list is one station.
    // Also create time_obj with {cid: time, ...}.
    for (let i = 0; i < ncid; i++) {
        var sxy; // [sx, sy] from scaleData()
        sxy = scaleData(lon_list[i], lat_list[i], map_info);
        icxy[cid_list[i]] = sxy;
        time_obj[cid_list[i]] = time_list[i];
    }
}

// DATA Processing
// Get the bottle data. It is packed like:
// {"cid":{"11":0,"20":0,"23":1,"42":1, ...
// In this case the the key is an oddly-numbered index (e.g. "11")
// and the value is the cid (e.g. 0).
// begin by forming lists of cid, z, and time. One list entry for each "bottle".
// Later we will form trimmed versions of these that only have entries
// where the associated data field is not null.
let data_cid_list = [], data_z_list = [], data_time_list = [];
let fld_list = ['CT', 'SA', 'DO (uM)', 'NO3 (uM)','DIC (uM)','TA (uM)'];
let data_lists = {};
let casts_all = {};
let data_info_all = {};

function process_data(obs_data, map_info) {
    for (const [key, value] of Object.entries(obs_data.cid)) {
        data_cid_list.push(value);
    }
    for (const [key, value] of Object.entries(obs_data.z)) {
        data_z_list.push(value);
    }
    for (const [key, value] of Object.entries(obs_data.time)) {
        data_time_list.push(new Date(value).getMonth() + 1);
    }
    // Next get the data fields.
    let this_data;
    fld_list.forEach(function (fld) {
        this_data = [];
        for (const [key, value] of Object.entries(obs_data[fld])) {
            this_data.push(value);
        }
        data_lists[fld] = this_data;
    });
    // Create the "data_info" objects (dicts) used for scaling and plotting the data.
    let fld_ranges = { 'CT': [4, 20], 'SA': [0, 34], 'DO (uM)': [0, 400], 'NO3 (uM)': [0, 50], 'DIC (uM)': [1200, 2600], 'TA (uM)': [1200, 2600]};
    let data_y0 = -200, data_y1 = 0; // z range (meters)
    // Define the size of the map svg.
    let data_w0 = 240, data_h0 = 240; // width and height (svg pixel sizes) for the data
    let data_info = {};
    fld_list.forEach(function (fld) {
        data_info = {
            x0: fld_ranges[fld][0], x1: fld_ranges[fld][1],
            y0: data_y0, y1: data_y1,
            w0: data_w0, h0: data_h0
        };
        data_info_all[fld] = data_info;
    });
    // Save the scaled DATA as a list in the format:
    // [ [x,y], [x,y], ...]
    // where each item in the list is one observation.
    let sdata_lists = {};
    fld_list.forEach(function (fld) {
        var sdxy = [];
        for (let i = 0; i < data_cid_list.length; i++) {
            var sxy; // [sx, sy] from scaleData()
            sxy = scaleData(data_lists[fld][i], data_z_list[i], data_info_all[fld]);
            sdxy.push(sxy);
        }
        sdata_lists[fld] = sdxy;
    });
    // Repackage the data into an object (dict) packed as:
    // {cid0: [ [x,y], [x,y], ...], cid1: [ [x,y], [x,y], ...], ...}
    // where the list corresponding to each cid is the scaled value and depths
    // for one CAST.
    // Also, drop any values where the data is null.
    fld_list.forEach(function (fld) {
        var casts = {};
        for (let i = 0; i < cid_list.length; i++) {
            var cid = cid_list[i];
            var this_cast = [];
            for (let j = 0; j < data_cid_list.length; j++) {
                var dcid = data_cid_list[j];
                if ((dcid == cid) && (data_lists[fld][j] != null)) {
                    this_cast.push(sdata_lists[fld][j]);
                }
            }
            casts[cid] = this_cast;
        }
        casts_all[fld] = casts;
    });
}

// PLOTTING Functions

// Create the cid_obj = {cid: #, cid: #, ...} where
// # = 1 by default
// # = 2 if a cast is in the brush extent but not in the month
// # = 3 if a cast is in bht brush extent AND the month
let cid_obj = {};
function update_cid_obj(brushExtent, slider) {
    cid_obj = {};
    cid_list.forEach(function (cid) {
        cid_obj[cid] = 1.0;
        if (icxy[cid][0] >= brushExtent[0][0] &&
            icxy[cid][0] <= brushExtent[1][0] &&
            icxy[cid][1] >= brushExtent[0][1] &&
            icxy[cid][1] <= brushExtent[1][1] &&
            time_obj[cid] != slider.value) {
            cid_obj[cid] = 2.0;
        }
        if (icxy[cid][0] >= brushExtent[0][0] &&
            icxy[cid][0] <= brushExtent[1][0] &&
            icxy[cid][1] >= brushExtent[0][1] &&
            icxy[cid][1] <= brushExtent[1][1] &&
            time_obj[cid] == slider.value) {
            cid_obj[cid] = 3.0;
        };
    });
}

function update_point_colors(whichSvg) {
    whichSvg.selectAll("#castCircle").remove();
    // Loop over all cid's and plot them, one circle per cast.
    cid_list.forEach(function (cid) {
        whichSvg.append('circle')
            .attr("id", 'castCircle')
            .attr('cx', icxy[cid][0])
            .attr('cy', icxy[cid][1])
            .attr('r', 3)
            .style('fill', function () {
                if (cid_obj[cid] == 1.0) {
                    return 'cyan';
                }
                else {
                    return 'blue';
                }
            });
    })
}

function update_cast_colors(fld, whichSvg) {
    // Loop over all cid and plot them, one line per cast.
    whichSvg.selectAll("#castLine").remove();
    cid_list.forEach(function (cid) {
        whichSvg.append("path")
            .attr("id", 'castLine')
            .attr("d", d3.line()(casts_all[fld][cid]))
            .attr("fill", "none")
            .style('stroke', function () {
                if (cid_obj[cid] == 1.0) {
                    return 'cyan';
                }
                else if (cid_obj[cid] == 2.0) {
                    return 'blue';
                }
                else if (cid_obj[cid] == 3.0) {
                    return 'red';
                }
            })
            .style('stroke-width', function () {
                if (cid_obj[cid] == 1.0) {
                    return .5;
                }
                else if (cid_obj[cid] == 2.0) {
                    return 1.0;
                }
                else if (cid_obj[cid] == 3.0) {
                    return 3.0;
                }
            })
            .style('opacity', function () {
                if (cid_obj[cid] == 1.0) {
                    return 0.3;
                }
                else if (cid_obj[cid] == 2.0) {
                    return 0.5;
                }
                else if (cid_obj[cid] == 3.0) {
                    return 1.0;
                }
            });
    });
}