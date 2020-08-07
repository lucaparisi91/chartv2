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
    const scenes =  useMemo( ()=>{return null} ,[] );


    const render=useCallback( (sceneToRender) => 
    {

      if (  (renderer !== null) && (camera !== null) )
      {
        console.log("rendering scene");
        renderer.render(sceneToRender,camera);
      }
  } ,[camera,renderer])

    const clear=useCallback( (sceneToRender) => 
        {

      if (  (renderer !== null) && (camera !== null) )
      {
      
       renderer.clear()
      }
        } ,[camera,renderer])

        
    const setScene= (index,scene)=>
    {
      scene[index] = scene;

    }


  useLayoutEffect( ()=> {

    const newRenderer = new THREE.WebGLRenderer({canvas: canvasRef.current,alpha: true});

    newRenderer.autoClear=false;

    newRenderer.setPixelRatio( window.devicePixelRatio );
    newRenderer.setSize( width, height );
    //newRenderer.setClearColor( 0xffffff, 0.);

    const newCamera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5 , 1, 5);

    newCamera.position.z = 2;
    newCamera.position.x=0;
    newCamera.position.y=0;

    renderer = newRenderer;
    camera = newCamera;
    
    

  },[]);

  return [canvasRef,render,clear];

}

const useThreeRenderer =  ( width=256,height=256) =>
{
  const [canvasRef, render,clear ] = useRenderer({width,height});

  return [canvasRef,render,clear]

};


const ThreeCanvas = ( {width=256,height=256 , children }) =>
{

  const [canvasRef,render,clear] = useThreeRenderer(width=width,height=height);



  clear();
  console.log("clear")
  
  return <div className="webgl-plot-area">
    <canvas width={width} height={height} ref={canvasRef} />
    {  
      React.Children.map( children, (child,index)=>{return React.cloneElement(child,{render,index});})
    }


</div>



};


export default ThreeCanvas;