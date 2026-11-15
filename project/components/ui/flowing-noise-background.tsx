import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GLView } from 'expo-gl';

// Add a prop to control the mode
interface FlowingBackgroundProps {
    isBalatroMode?: boolean;
}

export const FlowingNoiseBackground = ({ isBalatroMode = false }: FlowingBackgroundProps) => {

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // Normal Theme Color vs Balatro Mode Color (Dark Red)
        const backgroundColor = isBalatroMode ? '#4A0000' : '#333333';

        return (
            <View style={[StyleSheet.absoluteFill, { backgroundColor, zIndex: -1 }]} />
        );
    }

    // Pass the boolean as a float (0.0 or 1.0) to the shader
    const balatroVal = isBalatroMode ? 1.0 : 0.0;
    // We use a ref to pass this value into the render loop without triggering re-renders
    const isBalatroRef = useRef(balatroVal);

    useEffect(() => {
        isBalatroRef.current = isBalatroMode ? 1.0 : 0.0;
    }, [isBalatroMode]);

    const vertShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }`;

    const fragShaderSource = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_is_balatro; // <--- NEW UNIFORM

    // --- NOISE FUNCTIONS ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for(int i = 0; i < 6; i++) {
            value += amplitude * snoise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 0.8 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        // Speed up the animation slightly if in Balatro mode
        float speed = u_is_balatro > 0.5 ? 0.06 : 0.2;
        float t = u_time * speed;

        vec2 q = vec2(fbm(p + vec2(t * 0.3, t * 0.2)), fbm(p + vec2(t * 0.25, -t * 0.15)));
        vec2 r = vec2(fbm(p + 2.0 * q + vec2(t * 0.4, t * 0.3)), fbm(p + 2.0 * q + vec2(-t * 0.2, t * 0.25)));
        float noise = fbm(p + 3.0 * r);

        float wave1 = sin(p.x * 2.0 + t + noise * 2.0) * 0.5 + 0.5;
        float wave2 = sin(p.y * 1.5 - t * 0.8 + noise * 1.5) * 0.5 + 0.5;
        float combined = (wave1 + wave2 + noise) * 0.33;

        vec3 finalColor;

        if (u_is_balatro > 0.5) {
            vec3 deepRed = vec3(0.45, 0.01, 0.05);
          vec3 brightRed = vec3(0.85, 0.08, 0.12);
          vec3 deepBlue = vec3(0.02, 0.05, 0.65);
          vec3 brightBlue = vec3(0.15, 0.25, 0.95);
          vec3 purple = vec3(0.45, 0.1, 0.65);

          // Create more complex color mixing
          float colorMix = smoothstep(0.2, 0.8, combined);
          vec3 baseColor = mix(deepBlue, deepRed, colorMix);

          // Add accent colors based on noise
          if(combined > 0.6) {
            baseColor = mix(baseColor, purple, (combined - 0.6) * 2.5);
          }

          // Holographic shimmer effect
          float shimmer = sin(p.x * 15.0 + p.y * 10.0 + t * 3.0) * 0.5 + 0.5;
          shimmer *= sin(p.y * 20.0 - t * 4.0) * 0.5 + 0.5;
          vec3 shimmerColor = mix(brightBlue, brightRed, shimmer);
          finalColor = mix(baseColor, shimmerColor, shimmer * 0.15);

          // Pulsing glow effect
          float pulse = sin(t * 2.0) * 0.5 + 0.5;
          finalColor *= 0.85 + pulse * 0.15;

          // Edge highlighting
          float edgeGlow = smoothstep(0.7, 1.0, length(p * 0.6));
          finalColor = mix(finalColor, shimmerColor * 1.2, edgeGlow * 0.2);
        } else {
            // --- STANDARD MODE (Dark Grey/Black) ---
            vec3 c1 = vec3(0.08, 0.08, 0.08);
            vec3 c2 = vec3(0.18, 0.18, 0.19);
            vec3 c3 = vec3(0.35, 0.35, 0.37);
            vec3 c4 = vec3(0.55, 0.55, 0.58);
            vec3 c5 = vec3(0.75, 0.75, 0.78);

            if(combined < 0.2) finalColor = mix(c1, c2, combined * 5.0);
            else if(combined < 0.4) finalColor = mix(c2, c3, (combined - 0.2) * 5.0);
            else if(combined < 0.6) finalColor = mix(c3, c4, (combined - 0.4) * 5.0);
            else if(combined < 0.8) finalColor = mix(c4, c5, (combined - 0.6) * 5.0);
            else finalColor = mix(c5, c4, (combined - 0.8) * 5.0);

            float vignette = 1.0 - length(p * 0.25);
            finalColor *= 0.75 + vignette * 0.25;
        }

        gl_FragColor = vec4(finalColor, 1.0);
    }`;

    const onContextCreate = (gl: any) => {
        const compileShader = (source: string, type: any) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vert = compileShader(vertShaderSource, gl.VERTEX_SHADER);
        const frag = compileShader(fragShaderSource, gl.FRAGMENT_SHADER);
        if (!vert || !frag) return;

        const program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const timeLoc = gl.getUniformLocation(program, 'u_time');
        const resLoc = gl.getUniformLocation(program, 'u_resolution');
        const balatroLoc = gl.getUniformLocation(program, 'u_is_balatro'); // <--- Link Uniform

        const startTime = Date.now();

        const render = () => {
            const time = (Date.now() - startTime) * 0.001;
            gl.uniform1f(timeLoc, time);
            gl.uniform2f(resLoc, gl.drawingBufferWidth, gl.drawingBufferHeight);

            // Pass the current ref value to the shader
            gl.uniform1f(balatroLoc, isBalatroRef.current);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.flush();
            gl.endFrameEXP();
            requestAnimationFrame(render);
        };
        render();
    };

    if (Platform.OS === 'web') {
        // Keep your web fallback here if needed, but updated with the shader logic above
        return <View style={StyleSheet.absoluteFill}><GLView style={{ flex: 1, opacity: isBalatroMode ? 1.0 : 0.35 }} onContextCreate={onContextCreate} /></View>;
    }

    return (
        <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, { opacity: isBalatroMode ? 1.0 : 0.35, zIndex: -1 }]}>
                <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
            </View>
        </View>
    );
};
