import React, { Component , useEffect, useRef, useState, useLayoutEffect, useMemo} from 'react';
import ReactDOM, { unstable_renderSubtreeIntoContainer } from 'react-dom';
import * as d3 from "d3";
import * as THREE from 'three';
import ThreeCanvas from './ThreeCanvas';
import ScatterPlot from './ScatterPlot.js';
import Axis from './Axis.js';
import { Slider , Row, Col, InputNumber, Input} from 'antd';
import 'antd/dist/antd.css';
import { SketchPicker } from 'react-color';


const createMockData = ( N ) => 
{
  /*  
    y = x + scale * rand([0,1])
  */ 
    const scale=0.1;

    let positions = [];

    for ( let i=0;i<N;i++)
    {
        
        const x = (Math.random() - 0.5 );
        const y = x + (Math.random() - 0.5 )*scale;
        positions.push({ 
          "x" : x,
          "y" :  y
         } 
         );
    }

    positions =positions.sort((a,b)=>{return a["x"] - b["x"]});

    return positions;
}


const useScale =({length, axis, range=[-0.5,0.5]}) =>
{
  const [rangeState, setRange] = useState(  range );

  let screenRange;
  if (axis == "x")
  {
    screenRange = [0, length];
  }
  else if (axis== "y")
  {
    screenRange = [length,0];
  }


  const scale = useMemo( ()=> {  return d3.scaleLinear().domain(rangeState).range(screenRange); } , [rangeState, length]);

  return [rangeState, setRange, scale];

}

const RangeInput= ({range,setRange})=>{

  return <div className="rangeInput">
    <Row gutter={10}>
      <Col>
   <input type="number" 
  value={range[0]} 
  onChange={(e)=>{setRange([e.target.value,range[1]])}} /> 
  </Col>
  <Col>
  <Slider range min={ -0.5} max={0.5} value={range} style={{width:200}} onChange={setRange} step={0.01}/>
  </Col>
  <Col>
<input type="number" 
  value={range[1]} 
  onChange={(e)=>{setRange([range[0],e.target.value])}} /> 
</Col>
  </Row>
  </div>;
};

const AxisControl = ({axis,range,setRange}) =>
{

  return <div className="axisControl">
    <Row>
      <Col><h2> { axis} axis</h2> </Col>
      <Col></Col>
    </Row>
    <Row gutter={10}>
      <Col>Range: </Col>
      <Col> <RangeInput range={range} setRange={setRange}  /> </Col>
       </Row>

  </div>

}

const deepCopy=(a) =>
{
  return JSON.parse(JSON.stringify(a));
}

const StyleControl = ({mark,setMark,alpha,setAlpha})=>{

  
  return <div className="styleControl">
  <Row>
    <Col><h2> Style</h2> </Col>
    <Col></Col>
  </Row>
  <Row gutter={10}>
    <Col>Color:  </Col>
    <Col span={4}>  <Input value={mark.style.fill} 
      onChange = { (e) => {  
        const color = e.target.value;
        const newMark = deepCopy(mark);
        newMark.style.fill = color;
        setMark(newMark);
          } }
        
          style={{ width: '100%' }}
        
    /></Col>
    
    <Col>Size:   </Col>
    <Col>  <InputNumber value={mark.size} 
      onChange = { (e) => {  
        const size = e;
        const newMark = deepCopy(mark);
        newMark.size = size;
        setMark(newMark);
          } 
        }
        min={0}

    /></Col>

    <Col >
    Opacity: 
    </Col>
    <Col>
     <InputNumber value={alpha}
      onChange = { (e) =>{setAlpha(e);} }
      step={0.1}
      min={0}
      max={1}
     />
    </Col>
     </Row>

</div>

}



const ScatterChart =  ({data,x,y,width=256,height=256}) =>{

  //const xRange=d3.extent(data, (datum) => { return datum[x]} );

  const marginLeft=0.1 * width;
  const marginRight = 0.1 * width;
  const marginTop = 0.1 * height;
  const marginBottom = 0.1 * height;


  const [xRange, setXRange, xScale] = useScale( { range:  [-0.5,0.5] , length : width , axis : "x" });

  const [yRange, setYRange, yScale] = useScale( { range:  [-0.5,0.5] , length : height , axis : "y" });

  const[ mark , setMark ] = useState( { style:  {fill : "red"}, size: 10});

/*   const setMark = (settings) =>
  {
    const newMark = Object.assign(mark,settings);
    setMarkRaw(newMark);
  } */

  const [alpha,setAlpha] = useState(1.);

  


  return  <div>
  <div id="plot">
    
  <svg width={width + marginRight + marginLeft} height={height + marginTop + marginBottom}>

  <g   transform={`translate( ${marginLeft},${marginTop } )`}>
  <Axis scale={yScale} orientation="left" innerTickWidth= {width}
   />
  </g>

  <g transform={`translate( ${marginLeft},${marginTop + height} )`}>
  <Axis scale={xScale} orientation="bottom" innerTickWidth= {0}
   />
  </g>

   </svg>

   <div style={{position: "absolute",left: marginLeft,top : marginTop}} >
     <ThreeCanvas width={width} height={height} >
        <ScatterPlot data={data} x={x} y={y} xRange={ xRange} yRange={yRange} alpha={alpha} mark={ mark}/>
      </ThreeCanvas>
  </div>


   </div>

   <div style={{top: height + marginTop + marginBottom + 10,position: "absolute",left : marginLeft}}>
     <AxisControl axis="x" range={xRange} setRange={setXRange } />
     <AxisControl axis="y" range={yRange} setRange={setYRange } />
     <StyleControl 
     mark={mark} setMark={setMark}
      alpha={alpha} setAlpha={setAlpha}

     />
     
   </div>

  </div>

} ;









const renderMainScene = () =>
{
  const data=createMockData(1000);
  console.log("createdData");
  ReactDOM.render(
       <ScatterChart data={data} x={"x"}  y={"y"}width={600} height={200}  ></ScatterChart> ,
    document.getElementById('app')
  );

  
};

export default renderMainScene; 