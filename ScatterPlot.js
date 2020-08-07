import React, { Component , useEffect, useRef, useState, useLayoutEffect, useMemo} from 'react';
import ReactDOM, { unstable_renderSubtreeIntoContainer } from 'react-dom';
import * as d3 from "d3";
import * as THREE from 'three';

const useSprite=(filename) =>
{
  const sprite= useMemo(()=>{
  const newSprite = new THREE.TextureLoader().load( filename );

  return newSprite;

  },[filename]);


  return sprite;

}

const usePositionsBuffer= (data,x,y) =>
{
  /*
    Moves the data in an xyz array buffer. Filters out invalid numbers.
  */
  const positions = useMemo( ()=>{
    
    let extractedPositions= data.map( (row)=> {return [row[x],row[y],0]} );

    const isValidNumber= (n) =>
      {
        if ( !isNaN(n) && n!== undefined )
        {
          return true;
        } 
        else
        {return false;}
      }
     
    extractedPositions=extractedPositions.filter( (row) => 
    {
      return isValidNumber(row[0]) && isValidNumber(row[1]);
    });

    extractedPositions.minFilter
    // filter out invalid positions

    
    
    return  new Float32Array(extractedPositions.flat());

  }, [data,x,y]);


  return positions;

};


const Dot= ({width=256, height=256, shape="circle" , style={}}) =>
{
  if (shape==="circle")
  {
    return <circle cx={width/2} cy={height/2} r={width/2.}style={style}></circle>
  }  
}

const svgToTexture=({callback,width=256,height=256,dot=<Dot />}) =>
{

  function drawInlineSVG(svgElement, canvas, callback= () => {}) {
    var svgURL = new XMLSerializer().serializeToString(svgElement);
    var img = new Image();
    const ctx = canvas.getContext("2d");
    img.onload = function() {
      //ctx.imageSmoothingEnabled= false
      ctx.drawImage(this, 0, 0);
      callback(canvas);
    }
    img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL);
  }


  const node = document.createElement("DIV");

  //document.querySelector("body").appendChild(node);
  const dotClone = React.cloneElement(dot,{width : width, height : height});
  ReactDOM.render(
  <div>
  <svg width={width} height={height} >
    {dotClone}
  </svg> 
  <canvas width={width} height={height} /> 
  </div>, 
    node,
    ()=>
    {
      const canvas = node.querySelector("canvas");
      const svg = node.querySelector("svg");
      drawInlineSVG(svg,canvas, (canvas)=>{ 
           const texture = new THREE.CanvasTexture(canvas)
           texture.minFilter=THREE.NearestFilter;
            callback(texture);
        });
    })
    ;
  
  }



/* Returns a scatter plot with circle sprites */
const ScatterPlot = ( {data,render,x,y,filename="./circle.png",xRange= [-0.5,0.5] , yRange=[-0.5,0.5] , alpha=1. , mark = {}, addToScene}  ) =>
{

  const positions = usePositionsBuffer(data,x,y);
  const scene = useMemo(()=>{ return new THREE.Scene()},[]);

  const xscale =  1. / ( xRange[1] - xRange[0] ) ;
  const yscale = 1. / (yRange[1] - yRange[0]);

  scene.position.x =  -xRange[0]*xscale - 0.5;
  
  scene.scale.x = xscale;

  scene.position.y =  -yRange[0]*yscale - 0.5;
  scene.scale.y = yscale;

  useLayoutEffect( ()=>{

    const createScatterPlot=(texture) =>
    {
      const scatterPlot = new THREE.Object3D();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute ( positions   , 3));

      const material = new THREE.PointsMaterial( { size: 
        mark.size, sizeAttenuation: false,map : texture, transparent: true ,opacity: alpha} );

      const particles = new THREE.Points( geometry, material );
      scatterPlot.add(particles);

      while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
      scene.add(scatterPlot);

      addToScene(scene);
      render();

    }


    svgToTexture({callback: createScatterPlot,dot : <Dot  {...mark}  /> });


  },[mark,alpha,data,x,y])


  useEffect( ()=>{

    return () =>{
     addToScene(new THREE.Scene()) 
    }
  },[])

    render();
    return <div className="scatterPlot"/>;
  }


  export default ScatterPlot;