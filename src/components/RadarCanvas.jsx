import { useEffect, useRef } from "react";

function RadarCanvas({ players }) {

  const canvasRef = useRef(null);

  useEffect(()=>{

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0,0,width,height);

    // radar circles

    ctx.strokeStyle = "#00ff88";

    for(let i=1;i<=3;i++){

      ctx.beginPath();
      ctx.arc(centerX,centerY,i*60,0,Math.PI*2);
      ctx.stroke();

    }

    // center point

    ctx.fillStyle="#00ff88";

    ctx.beginPath();
    ctx.arc(centerX,centerY,5,0,Math.PI*2);
    ctx.fill();

    // draw players

    players.forEach((p,index)=>{

      const angle = (index / players.length) * Math.PI * 2;
      const radius = 80;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.fillStyle="#ff4444";

      ctx.beginPath();
      ctx.arc(x,y,6,0,Math.PI*2);
      ctx.fill();

    });

  },[players]);


  return(

    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{
        marginTop:"20px",
        border:"1px solid #00ff88",
        borderRadius:"50%"
      }}
    />

  );

}

export default RadarCanvas;