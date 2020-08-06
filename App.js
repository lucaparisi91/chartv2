import React, { Component , useEffect, useRef, useState, useLayoutEffect, useMemo} from 'react';
import ReactDOM, { unstable_renderSubtreeIntoContainer } from 'react-dom';
import * as d3 from "d3";
import * as THREE from 'three';
import ThreeCanvas from './ThreeCanvas';
import ScatterPlot from './ScatterPlot.js';
import Axis from './Axis.js';
import { Slider , Row, Col, InputNumber, Input, Button, Switch } from 'antd';
import 'antd/dist/antd.css';
import { SketchPicker } from 'react-color';
import { LoadingOutlined } from '@ant-design/icons';


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

const RangeInput= ({range,setRange,min,max})=>{

  return <div className="rangeInput">
    <Row gutter={10}>
      <Col>
   <input type="number" 
  value={range[0]} 
  onChange={(e)=>{setRange([e.target.value,range[1]])}} /> 
  </Col>
  <Col>
  <Slider range min={min} max={max} value={range} style={{width:200}} onChange={setRange} step={0.01}/>
  </Col>
  <Col>
<input type="number" 
  value={range[1]} 
  onChange={(e)=>{setRange([range[0],e.target.value])}} /> 
</Col>
  </Row>
  </div>;
};


const AxisControl = ({axis,range,setRange,lim, showGrid = false , setShowGid = ()=>{}}) =>
{
  
  return <div className="axisControl">
    <Row>
      <Col><h2> { axis} axis</h2> </Col>
      <Col></Col>
    </Row>
    <Row gutter={10}>
      <Col>Range: </Col>
      <Col> <RangeInput min={lim[0]} max={lim[1]}  range={range} setRange={setRange}  /> </Col>
       </Row>
    <Row gutter= {10} >
      <Col>Show grid: </Col> 
      <Col>  
      <Switch checked={showGrid} onChange = {(checked)=>{setShowGid(checked)} } />
       </Col>
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


const useData = (initialData,x,y) =>
{
  const [loadedData, setLoadedData] = useState(initialData);


  const [xLim,setXLim] = useState([-0.5,0.5]);
  const [yLim,setYLim] = useState([-0.5,0.5]);

   useEffect(()=>{

    if (loadedData !== [] )
    {


      let xExtent = d3.extent(loadedData,(d)=>{return parseFloat(d[x])}) ;
      let yExtent = d3.extent(loadedData,(d)=>{return parseFloat(d[y])}) ;
      

      if ( xExtent.includes(undefined) )
      {
        xExtent = [-0.5,0.5];
      }

      if ( yExtent.includes(undefined) )
      {
        yExtent = [-0.5,0.5];
      }

      setYLim(yExtent);
      setXLim(xExtent);
      

    }
    
  },[loadedData])


  return [loadedData,setLoadedData, xLim, setXLim, yLim , setYLim]
}


const ScatterChart =  ({data={},x,y,width=256,height=256}) =>{

  //const xRange=d3.extent(data, (datum) => { return datum[x]} );

  const marginLeft=0.1 * width;
  const marginRight = 0.1 * width;
  const marginTop = 0.1 * height;
  const marginBottom = 0.1 * height;


  const [loadedData, setLoadedData,xLim,setXLim,yLim,setYLim] = useData(data,x,y);

  const [xRange, setXRange, xScale] = useScale( { range: [-0.5,0.5] , length : width , axis : "x" });

  const [yRange, setYRange, yScale] = useScale( { range:  [-0.5,0.5] , length : height , axis : "y" });

  const[ mark , setMark ] = useState( { style:  {fill : "red"}, size: 10});

  useEffect(
    ()=>{
      setXRange(xLim);
    } , [xLim]
  )

  useEffect(
    ()=>{
      setYRange(yLim);
    } , [yLim]
  )


  const loadData = (filename, callback = () =>{} ) =>
  {
    setFileName(filename);

    if (filename === "")
    {
      setLoadedData( [] );
      callback();
    }
    else
    {
    
    d3.dsv(" ",filename).then (
      (data)=>{

        setLoadedData(data);
        callback();
      })
      .catch(e =>
      {
        console.log("Failed do load data");
        setLoadedData([]);
        callback();
      } );
    
    
  }
  
  

  }

/*   const setMark = (settings) =>
  {
    const newMark = Object.assign(mark,settings);
    setMarkRaw(newMark);
  }
*/

  const [alpha,setAlpha] = useState(1.);
  const [fileName,setFileName] = useState("");


  const [showXGrid, setShowXGrid] = useState(false);
  const [showYGrid, setShowYGrid] = useState(false);
  
  const xInnerTickWidth =  useMemo( ()=>{

    return showXGrid  ? height : 0 ;

  },[showXGrid])


  const yInnerTickWidth =  useMemo( ()=>{

    return showYGrid  ? width : 0 ;

  },[showYGrid])



  return  <div>
  <div id="plot">
    
  <svg width={width + marginRight + marginLeft} height={height + marginTop + marginBottom}>

  <g   transform={`translate( ${marginLeft},${marginTop } )`}>
  <Axis scale={yScale} orientation="left" innerTickWidth= {yInnerTickWidth}
   />
  </g>

  <g transform={`translate( ${marginLeft},${marginTop + height} )`}>
  <Axis scale={xScale} orientation="bottom" innerTickWidth= {xInnerTickWidth}
   />
  </g>

   </svg>

   <div style={{position: "absolute",left: marginLeft,top : marginTop}} >
     <ThreeCanvas width={width} height={height} >
        <ScatterPlot data={loadedData} x={x} y={y} xRange={ xRange} yRange={yRange} alpha={alpha} mark={ mark}/>
      </ThreeCanvas>
  </div>


   </div>

   <div style={{top: height + marginTop + marginBottom + 10,position: "absolute",left : marginLeft}}>
     <ReadData 
       fileName={fileName}
       setFileName={loadData} 
     ></ReadData>
     <AxisControl axis="x" range={xRange} setRange={setXRange } lim={xLim} 
     showGrid = {showXGrid}
      setShowGid = {setShowXGrid}

     />
     <AxisControl axis="y" range={yRange} 
     setRange={setYRange } lim={yLim} 
     showGrid = {showYGrid} setShowGid = {setShowYGrid}
     />
     <StyleControl 
     mark={mark} setMark={setMark}
      alpha={alpha} setAlpha={setAlpha}

     />
     
   </div>

  </div>

} ;


const ReadData =({fileName,setFileName}) =>
{

  const inputValue = useRef(null);

  const [isLoading , setIsLoading] = useState(false);

  return <Row gutter={10}>

    <Col>
    Input : 
    </Col>

    <Col>
      <Input ref={inputValue} defaultValue={fileName} 
      />
    </Col>

    <Col>
      <Button
        onClick={()=>{
          setIsLoading(true);

          const notifyEndLoading = ( ) => {setIsLoading(false);console.log("end"); }
          const newFileName = inputValue.current.state.value;


          setFileName(newFileName,notifyEndLoading);
        
        }}
      
      >Load </Button>
    </Col>
        <Col>
        {
          isLoading && <LoadingOutlined /> 
        }
        
        </Col>

    </Row>
  
}






const renderMainScene = () =>
{
  const data=createMockData(0);

  const filename = "mockData.dat"

  


  ReactDOM.render(
      <ScatterChart data={data} x={"x"}  y={"y"}width={600} height={200}  ></ScatterChart> ,
   document.getElementById('app')
    
    
    );

};

export default renderMainScene; 