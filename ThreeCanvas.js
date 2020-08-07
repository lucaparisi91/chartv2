import React, { Component , useEffect, useRef, useState, useLayoutEffect, useMemo, useCallback, cloneElement} from 'react';
import ReactDOM, { unstable_renderSubtreeIntoContainer } from 'react-dom';
import * as d3 from "d3";
import * as THREE from 'three';
import { Camera } from 'three';

const useRenderer=({width,height})=>
{
    const canvasRef = useRef(null);
    let camera = useMemo( ()=>{return null} ,[] );
    let renderer = useMemo( ()=>{return null} ,[] );
    const scenes =  useMemo( ()=>{return new Map() },[] );
    const mainScene = useMemo( ()=>{ return new THREE.Scene() } , [] );
    
    const render=useCallback( () => 
    {

      if (  (renderer !== null) && (camera !== null) )
      {
        
        renderer.render(mainScene,camera);
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
      scenes.set(index, scene);
      

      while(mainScene.children.length > 0){ 
        mainScene.remove(mainScene.children[0]); 
      }

       for ( let [index,scene] of scenes)
      {
        mainScene.add(scene);
      } 
    }


  useLayoutEffect( ()=> {

    const newRenderer = new THREE.WebGLRenderer({canvas: canvasRef.current,alpha: true});

    newRenderer.autoClear=true;

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

  return [canvasRef,render,clear,setScene];

}

const useThreeRenderer =  ( width=256,height=256) =>
{
  const [canvasRef, render,clear ,addToScene] = useRenderer({width,height});

  return [canvasRef,render,clear,addToScene]

};


const ThreeCanvas = ( {width=256,height=256 , children }) =>
{

  const [canvasRef,render,clear,addToScene] = useThreeRenderer(width=width,height=height);


  useEffect ( () =>
  {
    render();
  });


  
  return <div className="webgl-plot-area">
    <canvas width={width} height={height} ref={canvasRef} />
    {  
      React.Children.map( children, (child,index)=>{return React.cloneElement(child,{render, addToScene : (scene)=>{addToScene(child.key,scene) } });})
    }


</div>



};


export default ThreeCanvas;