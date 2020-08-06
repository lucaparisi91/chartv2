import React, { Component , useEffect, useRef, useState, useLayoutEffect, useMemo, useCallback} from 'react';
import ReactDOM, { unstable_renderSubtreeIntoContainer } from 'react-dom';
import * as d3 from "d3";
import * as THREE from 'three';
import { Camera } from 'three';

const useRenderer=({width,height})=>
{
    const canvasRef = useRef(null);
    let camera = useMemo( ()=>{return null} ,[] );
    let renderer = useMemo( ()=>{return null} ,[] );

    const render=useCallback( (sceneToRender) => 
    {

      if (  (renderer !== null) && (camera !== null) )
      {
        console.log("render");
        renderer.render(sceneToRender,camera);
      }
  } ,[camera,renderer])

  
  useLayoutEffect( ()=> {

    const newRenderer = new THREE.WebGLRenderer({canvas: canvasRef.current,alpha: true});

    newRenderer.setPixelRatio( window.devicePixelRatio );
    newRenderer.setSize( width, height );
    //newRenderer.setClearColor( 0xffffff, 0.);

    const newCamera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5 , 1, 5);

    newCamera.position.z = 2;
    newCamera.position.x=0;
    newCamera.position.y=0;

    renderer = newRenderer;
    camera = newCamera;
    
    console.log("builtRendered");

  },[]);


  return [canvasRef,render];

}

const useThreeRenderer =  ( width=256,height=256) =>
{
  const [canvasRef, render ] = useRenderer({width,height});

  return [canvasRef,render]

};


const ThreeCanvas = ( {width=256,height=256 , children }) =>
{

  const [canvasRef,render] = useThreeRenderer(width=width,height=height);

  console.log("parent-render");
  
  return <div className="webgl-plot-area">
    <canvas width={width} height={height} ref={canvasRef} />
    {  
      React.Children.map( children, (child)=>{return React.cloneElement(child,{render});})
    }


</div>



};


export default ThreeCanvas;