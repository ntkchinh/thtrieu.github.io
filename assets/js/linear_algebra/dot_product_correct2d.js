var dot_product_correct2d = (function() {



var origin = [150, 140], 
  scale = 60, 
  scatter = [], 
  axis = [],
  expectedAxis = [],
  startAngleX = Math.PI,
  startAngleY = 0.,
  startAngleZ = 0.;
let  axis_len = 2;

let unit = axis_len/10;

var svg = d3.select("#svg_dot_product_correct2d");


var lib = space_plot_lib(
  svg,
  origin, 
  scale,
  is_2d=true);


svg = svg.call(d3.drag()
         .on('drag', dragged)
         .on('start', drag_start)
         .on('end', drag_end))
         .append('g');

axis = lib.init_float_axis(axis_len=axis_len, unit=unit);


function plot(scatter, axis, tt){

  basis = {
      ex: axis[1/unit - 1 + axis_len * 0][1], 
      ey: axis[1/unit - 1 + axis_len * 1][1],
      ez: {x: 0, y: 0, z: 0}, // dummy 
  };

  let u = scatter[0];
  let v = scatter[1];
  v.centroid_z = 1000;

  let v_norm = Math.sqrt(v.x*v.x + v.y*v.y);
  let v_ = {
      x: v.x/v_norm,
      y: v.y/v_norm,
      z: 0.0,
      color: 2,
      r: 6,
      opacity: 0.6,
      centroid_z: -1000,
      text: '|v| = 1.00',
      text_opacity: 0.5
  }

  scatter.forEach(function(d, i){
    var coord = lib.dot_basis(d, basis);
    if (i == 0) {
      d.text = 'u';
    } else {
      d.text = '|v| = ' + v_norm.toFixed(2);
    }
  })

  lib.plot_lines(axis);

  var lines = [];
  scatter.forEach(function(d,i){
    let line = [
        {x: 0., y: 0., z: 0.},
        {x: d.x, y: d.y, z: d.z}
    ]
    line.color = d.color;
    lines.push(line);
    if (i == 0) {
      lines.centroid_z = 900;
    }
  });


  let uTv = lib.dot_product(u, v);
  let uTvv = {
      x: v_.x * uTv,
      y: v_.y * uTv,
      z: 0,
      color: 0,
      tt: true
  }

  let proj_len = lib.dot_product(u, v_);
  let uTvv_ = {
      x: v_.x * proj_len,
      y: v_.y * proj_len,
      z: 0,
      color: 4,
      tt: true
  }

  let uTvv_line = [
      {x: 0, y: 0, z: 0},
      uTvv
  ];
  uTvv_line.text = 'u\u1d40v';
  uTvv_line.text_color = 0;
  uTvv_line.font_size = 15;
  uTvv_line.stroke_width = 2.0
  uTvv_line.centroid_z = 1000;

  let uTvv__line = [
      {x: 0, y: 0, z: 0},
      uTvv_
  ];
  // uTvv__line[1].text = 'p';
  uTvv__line.opacity = 0.6;
  uTvv__line.stroke_width = 5.0;
  uTvv__line.color = 0;

  lines.push(uTvv_line);
  lines.push(uTvv__line);
  let points = [u, v, v_];

  let dash_line = [
      {x: u.x, y: u.y, z: u.z},
      {x: uTvv_.x, y: uTvv_.y, z: 0,
       tt:true}];
  
  dash_line.dash = true;
  dash_line.centroid_z = -5;
  lines.push(dash_line);

  lib.plot_lines(lines, tt, 'arrow',
                 drag_line_fn=dragged_point_only,
                 drag_start_fn=drag_start,
                 drag_end_fn=drag_end);
  lib.plot_points(points, tt,
                  drag_point_fn=dragged_point,
                  drag_start_fn=drag_start,
                  drag_end_fn=drag_end);
  lib.sort();
}


function init(){
  scatter = [];

  scatter.push({
    x: -1.0,
    y: -4.0/3, 
    z: 0.,
    color: 4,
  });

  scatter.push({
    x: 1/Math.sqrt(3),
    y: -Math.sqrt(2/3), 
    z: 0.,
    color: 2,
  })


  alpha = startAngleX;
  beta = startAngleY;

  expectedScatter = lib.rotate_points(scatter, alpha, beta, startAngleZ);
  expectedAxis = lib.rotate_lines(axis, alpha, beta, startAngleZ);
  plot(expectedScatter, 
       expectedAxis, 
       1000);
  drag_end();
}


function drag_start(){
  lib.drag_start2d();
}

function dragged(){
  angle_z = lib.get_drag_angle_2d();

  expectedScatter = lib.rotate_points(scatter, 0, 0, angle_z);
  expectedAxis = lib.rotate_lines(axis, 0, 0, angle_z);
  
  plot(expectedScatter, 
       expectedAxis, 
       0);
}

function dragged_point_only(){
  angle_z = lib.get_drag_angle_2d();

  expectedScatter = lib.rotate_points(scatter, 0, 0, angle_z);
  
  plot(expectedScatter, 
       expectedAxis, 
       0);
}

function stretch_point(d, i){
  let d_ = lib.normalize(d);
      m = lib.mouse_to_point_position();
  let d_Tm = lib.dot_product(d_, m);
  let p = {
    x: d_.x * d_Tm,
    y: d_.y * d_Tm,
    z: 0,
  }
  expectedScatter = [];
  scatter.forEach(function(d, j){
      if (j == i) {
        d.x = p.x;
        d.y = p.y;
      }
      expectedScatter.push(d);
  });

  plot(expectedScatter, 
       expectedAxis, 
       0);
}

function dragged_point(d, i){
  if (i == 1) {
    stretch_point(d, i);
    return;
  } else if (i == 2) {
    dragged_point_only();
    return;
  }
  expectedScatter = [];
  scatter.forEach(function(d, j){
      if (j == i) {
        expectedScatter.push(
            lib.update_point_position_from_mouse(d));
      } else {
        expectedScatter.push(d);
      }
  });

  plot(expectedScatter, 
       expectedAxis, 
       0);
}


function drag_end(){
  scatter = expectedScatter;
  axis = expectedAxis;
  startAngleX = 0;
  startAngleY = 0;
  startAngleZ = 0;
}

init();

return {
  init: function(){init();}
};

})();