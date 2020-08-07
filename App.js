import React, { Component , useEffect, useRef, useState, useLayoutEffect, useMemo} from 'react';
import ReactDOM, { unstable_renderSubtreeIntoContainer } from 'react-dom';
import * as d3 from "d3";
import * as THREE from 'three';
import ThreeCanvas from './ThreeCanvas';
import ScatterPlot from './ScatterPlot.js';
import Axis from './Axis.js';
import { Slider , Row, Col, InputNumber, Input, Button, Switch, Select } from 'antd';
import 'antd/dist/antd.css';
import { SketchPicker } from 'react-color';
import { LoadingOutlined, CopyFilled } from '@ant-design/icons';
import { DefaultLoadingManager } from 'three';



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

const AxisControl = ({axis,range,setRange,lim, showGrid = false , setShowGid = ()=>{}, columns=[] , selectedColumn, setSelectedColumn}) =>
{

  const { Option } = Select;

  let mode = undefined;



  if (axis === "y" )
  {
    mode = "multiple";
  }


  const options = columns.map(
    (column)=>{
      return <Option key={column} value={column} > {column} </Option>

    }

  )

  return <div className="axisControl">
    <Row>
      <Col ><h2> { axis} axis</h2> </Col>
      <Col></Col>
    </Row>
    <Row gutter={10} >
      <Col>Column: </Col>
      <Col span={6}>
        <Select value={selectedColumn} mode={mode} onChange={(newColumn)=>{setSelectedColumn(newColumn)}}       
          style={{ width: '100%' }}
>
          {options}
        </Select>
      </Col>
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

const MarkControl = ({label,mark,setMark, alpha, setAlpha})=>
{
  return   <Row gutter={10}>
    <Col>{label}</Col>
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
}


const StyleControl = ({marks,setMark,alpha,setAlpha})=>{
  
  const markControls=[]

  for (let [label, mark] of marks)
  {
    markControls.push(

      <MarkControl key={label} 
      label={label}
    mark={marks.get(label) } 
    setMark={
      (newMark)=>{ 
        setMark(label,newMark);
      }
            }
    alpha={alpha}
    setAlpha={setAlpha}
           />

    )
  }


/* 
  const markControls = labels.map((label) => {
    return  <MarkControl key={label} 
    mark={marks.get(label) } 
    setMark={
      (newMark)=>{ 
        setMark(label,newMark);
      }
            }
    alpha={alpha}
    setAlpha={setAlpha}
           />
  }
  ) */

  return <div className="styleControl">
  <Row>
    <Col><h2> Style</h2> </Col>
  </Row>

  {markControls}
 
</div>

}

const getColumns = (data) =>
{
  let columns = data.columns;
  if (columns === undefined) {columns=[];}

  return  columns;

}


const useData = (initialData,x,y) =>
{
  const [loadedData, setLoadedData] = useState(initialData);

  const [xLabel , setXLabel] = useState(x);

  const [yLabel , setYLabel] = useState(y);



  const [columns,setColumns] = useState([]);


  const [xLim,setXLim] = useState([-0.5,0.5]);
  const [yLim,setYLim] = useState([-0.5,0.5]);

   useEffect(()=>{

    if (loadedData !== [] )
    {

      let xExtent = d3.extent(loadedData,(d)=>{return parseFloat(d[xLabel])}) ;

      const yExtents = yLabel.map(
        (label)=> {
          return d3.extent(loadedData,(d)=>{return parseFloat(d[label])}) ;
        })

      const ymin = d3.min(yExtents, (d) =>{return d[0]})
      const ymax = d3.max(yExtents, (d) =>{return d[1]})

      let yExtent = [ymin,ymax];


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
      const newColumns = getColumns(loadedData);

      setColumns(newColumns);

    }
  },[loadedData,xLabel,yLabel])

  return [loadedData,setLoadedData, xLim, setXLim, yLim , setYLim,columns,setColumns,xLabel,setXLabel,yLabel,setYLabel]

}


const ScatterChart =  ({data={},x,y,width=256,height=256,file=""}) =>{

  //const xRange=d3.extent(data, (datum) => { return datum[x]} );

  const marginLeft=0.1 * width;
  const marginRight = 0.1 * width;
  const marginTop = 0.1 * height;
  const marginBottom = 0.1 * height;

  const [fileName,setFileName] = useState(file);

  const [loadedData, setLoadedData,xLim,setXLim,yLim,setYLim,columns,setColumns,
    xLabel,setXLabel,
    yLabel,setYLabel] = useData(data,x,y);

  const [xRange, setXRange, xScale] = useScale( { range: [-0.5,0.5] , length : width , axis : "x" });

  const [yRange, setYRange, yScale] = useScale( { range:  [-0.5,0.5] , length : height , axis : "y" });

  const defaultMark = () =>{
    return  { style:  {fill : "red"}, size: 10}

  }

  const[ marks , setMarks ] = useState( new Map() );


  const setMark=(label,mark) =>
  {
    const newMarks = new Map(marks);
    newMarks.set(label,mark);

    setMarks(newMarks);
  }


  useEffect(()=>{
    const newYLabels = yLabel.filter( (label)=>{return !(marks.has(label));} );

    const newMarks = new Map(marks);


    
    for ( let label of newYLabels )
    {
      newMarks.set(label, defaultMark() );
    }
    setMarks(newMarks);

  },[yLabel])



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
        setLoadedData([]);
        callback();
      } );
    
    
  }
  
  

  }

   
  const [alpha,setAlpha] = useState(1.);
  


  const [showXGrid, setShowXGrid] = useState(false);
  const [showYGrid, setShowYGrid] = useState(false);
  
  const xInnerTickWidth =  useMemo( ()=>{

    return showXGrid  ? height : 0 ;

  },[showXGrid])


  const yInnerTickWidth =  useMemo( ()=>{

    return showYGrid  ? width : 0 ;

  },[showYGrid])

  //console.log(marks);

  let scatterPlots = []

  if (yLabel !== undefined)
  {
    scatterPlots = yLabel.map((label)=>{
      return <ScatterPlot data={loadedData} x={xLabel} y={label} xRange={ xRange} yRange={yRange} alpha={alpha} mark={ marks.get(label) } key={label}/> 

    })

  }
  
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
       {scatterPlots} 
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
      columns  = {columns}
      selectedColumn = {xLabel}
      setSelectedColumn = {setXLabel}

     />
     <AxisControl axis="y" range={yRange} 
     setRange={setYRange } lim={yLim} 
     showGrid = {showYGrid} setShowGid = {setShowYGrid}
     columns  = {columns}
     selectedColumn = {yLabel}
     setSelectedColumn = {setYLabel}
     />

      
     <StyleControl 
     marks={marks} setMark={setMark}
      alpha={alpha} setAlpha={setAlpha}

     />

   </div>

  </div>

} ;


const ReadData =({fileName,setFileName}) =>
{

  const inputValue = useRef(null);

  const [isLoading , setIsLoading] = useState(false);

  useLayoutEffect(()=>{
    load();

  },[])
  const load = ()=>{
    setIsLoading(true);

    const notifyEndLoading = ( ) => {setIsLoading(false);}
    const newFileName = inputValue.current.state.value;


    setFileName(newFileName,notifyEndLoading);
  
  };

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
        onClick={load}
      
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
      <ScatterChart data={data} file={filename} width={600} height={200} x={"x"} y={["y"]} ></ScatterChart> ,
   document.getElementById('app')
    
    
    );

};

export default renderMainScene; 