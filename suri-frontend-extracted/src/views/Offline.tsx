import { View } from '../types';
import { useEffect, useRef } from 'react';

interface OfflineProps {
  navigate: (view: View) => void;
}

export function Offline({ navigate }: OfflineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      
      void main() {
          vec2 uv = v_texCoord;
          float dist = distance(uv, vec2(0.5 + sin(u_time * 0.5) * 0.1, 0.5 + cos(u_time * 0.5) * 0.1));
          float dist2 = distance(uv, vec2(0.5 + cos(u_time * 0.3) * 0.2, 0.5 + sin(u_time * 0.4) * 0.1));
          
          vec3 color1 = vec3(0.94, 0.92, 0.90);
          vec3 color2 = vec3(0.70, 0.55, 0.48);
          
          float strength = smoothstep(0.6, 0.0, dist) * 0.15;
          strength += smoothstep(0.5, 0.0, dist2) * 0.1;
          
          vec3 finalColor = mix(color1, color2, strength);
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type);
      gl!.shaderSource(s!, src);
      gl!.compileShader(s!);
      return s!;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog!, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog!, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog!);
    gl.useProgram(prog!);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog!, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog!, 'u_time');
    
    let animationFrameId: number;

    function render(t: number) {
      if (!canvas || !gl) return;
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-[#f0edea] h-full w-full flex items-center justify-center relative overflow-hidden font-sans text-on-background">
      <div className="absolute inset-0 w-full h-full z-0 opacity-60 mix-blend-multiply pointer-events-none">
        <canvas ref={canvasRef} className="block w-full h-full"></canvas>
      </div>

      <main className="relative z-10 w-full px-8 py-10 flex flex-col items-center text-center bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl mx-6">
        <div className="relative mb-8 flex items-center justify-center w-full">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwhExQlQQw3vt4SGxLb2V019b5lvSXJzXEFpPU8VqjcEZmQPBPV2mh9i02-v47PKR_50YOAl4X8a7kQAsP4e7gWycuSLH7cs2sc9LXHA3M_RVjHryNpIL-4nQRSx5hGWXnUAG9cRNz_DdNzj3X2uicDOOwG-iDIl3NxqU1C5rJeQq9DRNtFqSFk2EsAXWEI-9QLYGA7UDLhCQNxwDB087UYxKOuytOk0TTqNJRCuW4ecWZerT561ZK3jjZ0ScP7VbZ-PAQudJZIzQ" 
            alt="Suri Sleeping" 
            className="w-48 h-48 object-contain"
          />
        </div>
        
        <h1 className="font-display text-3xl mb-4 text-[#3a3532] font-extrabold tracking-tight">
          Nasa Offline Mode Ka
        </h1>
        <p className="font-sans text-base text-[#68615d] mb-10 tracking-wide">
          Huwag mag-alala, gagana pa rin ang Suri Local. Mag-aral gamit ang iyong mga downloaded modules.
        </p>

        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={() => navigate('chat')}
            className="w-full bg-gradient-to-b from-[#af8271] to-[#996e5d] text-[#f8f5f3] py-4 px-6 rounded-full font-sans font-bold text-lg hover:brightness-110 shadow-md hover:shadow-lg transition-all"
          >
            Magpatuloy sa Pag-aaral
          </button>
          <button 
            onClick={() => navigate('settings')}
            className="w-full bg-transparent text-[#5e5753] py-4 px-6 rounded-full font-sans font-semibold text-lg hover:bg-black/5 transition-colors border border-[#c2b9b4]"
          >
            Tingnan ang Offline Settings
          </button>
        </div>
      </main>
    </div>
  );
}
