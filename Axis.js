import * as d3 from 'd3';
import React  from 'react';

const Tick = ({orientation,width,innerWidth=0}) =>
{
    let innerTick;

    const getTickEndPoints= (orientation) =>
    {
        if (orientation === "bottom")
        {
            return [ [0,0] , [0,width]    ]
        }
        else if (orientation === "left")
        {
        return [ [-width,0] , [0,0]  ]
        }
    }

    if (orientation === "bottom")
    {
        innerTick=
        <line 
        className="inner"
        x1={0} 
        x2={0}
        y1={0}
        y2={-innerWidth}
        />
    }

    
    if (orientation === "left")
    {
        innerTick=
        <line 
        className="inner"
        x1={0} 
        x2={innerWidth}
        y1={0}
        y2={0}
        />
    }



    const [ [x1,y1], [x2,y2]  ] =getTickEndPoints(orientation);



    return <g className="tick">   
     <line className="outer"
        x1={x1}
        x2={x2}

        y1={y1}
        y2={y2}
        />

        {innerTick}
        </g>

    
}


function createScale({range,domain,expandFactor=0})
{
    const domainWidth= domain[1] - domain[0];

    const expandedDomain= [ 
        domain[0] - domainWidth*expandFactor,
        domain[1] + domainWidth*expandFactor
        
    ]


    const scale = d3.scaleLinear()
    .domain(expandedDomain)
    .range(range);
    return scale;
}


const Axis = ({scale,orientation , innerTickWidth=10}) =>
{
    const domain = scale.domain();
    const range = scale.range();

    

    const tickWidth=6;
    
    
    const width= range[1] - range[0];


    const tickValues = scale.ticks()
    const tickRangeOffsets = tickValues.map( (offSet) => scale(offSet))
    
    const ticks = d3.zip(tickRangeOffsets,tickValues).map(([offSet,label]) => {

    const tick = <Tick orientation={orientation} width={tickWidth} innerWidth={innerTickWidth} ></Tick>;
    let tickTransform;
    let labelTransform;
    
    if ( orientation == "bottom" )
    {
        tickTransform=`translate(${offSet},0)`;
        labelTransform=`translateY(${ 20}px)`;

    }
    else if (orientation == "left")
    {
        tickTransform=`translate(0,${offSet})`;
        labelTransform=`translateX(-${20}px)`;

    }



    return <g transform={tickTransform} key={offSet}>
            {tick}
            <text
            style={{
              fontSize: "10px",
              textAnchor: "middle",
              transform: labelTransform
            }}>
                {label}
            </text>
        </g>
    });


    const getEndPoints= (orientation,range) =>
    {
        if ( orientation == "bottom" )
            {
            return [[range[0],0] , [range[1],0] ]
            }
        else if (orientation == "left")
            {
                return [[0,range[0]] , [0,range[1]]]
            }
    }


    const [[x1,y1],[x2,y2]] = getEndPoints(orientation,range);


    return  <g className={"axis"}>

                <line
                x1={x1} 
                x2={x2}
                y1={y1}  
                y2={y2} 
                />  

                {ticks}

                </g>
};





export default Axis;
