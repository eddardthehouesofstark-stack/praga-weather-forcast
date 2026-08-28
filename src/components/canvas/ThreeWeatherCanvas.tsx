import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WeatherThemeType } from '../../types/weather';

interface ThreeWeatherCanvasProps {
  themeType: WeatherThemeType;
  isDay: boolean;
  windSpeed: number; // in km/h
  is3dEnabled: boolean;
  reducedMotion: boolean;
}

export const ThreeWeatherCanvas: React.FC<ThreeWeatherCanvasProps> = ({
  themeType,
  isDay,
  windSpeed,
  is3dEnabled,
  reducedMotion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Objects to animate
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const lightningLightRef = useRef<THREE.PointLight | null>(null);
  const lightningMeshRef = useRef<THREE.Line | null>(null);
  const nextLightningTimeRef = useRef<number>(0);
  const lightningDurationRef = useRef<number>(0);

  const mousePosRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const scrollOffsetRef = useRef<number>(0);

  // Listen for mouse move and scroll parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePosRef.current.targetX = nx * 0.6;
      mousePosRef.current.targetY = ny * 0.4;
    };

    const handleScroll = () => {
      if (reducedMotion) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollOffsetRef.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [reducedMotion]);

  // Setup and update Three.js scene
  useEffect(() => {
    if (!containerRef.current || !is3dEnabled || reducedMotion) {
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Create Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 25;
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      rendererRef.current = renderer;

      // Clear any previous canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D environment', e);
      return;
    }

    // Dynamic object holder
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    // Base Lighting
    const ambientLight = new THREE.AmbientLight(isDay ? 0xffffff : 0x334155, isDay ? 0.9 : 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(isDay ? 0xfffaed : 0x93c5fd, isDay ? 1.4 : 0.6);
    dirLight.position.set(10, 18, 15);
    scene.add(dirLight);

    // Weather specific scene builder
    buildWeatherScene(themeType, isDay, dynamicGroup, scene);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;

      if (cameraRef.current) {
        const scrollShift = scrollOffsetRef.current * 8;
        cameraRef.current.position.x = mousePosRef.current.x * 2.5;
        cameraRef.current.position.y = mousePosRef.current.y * 2.0 - scrollShift;
        cameraRef.current.lookAt(0, -scrollShift * 0.5, 0);
      }

      // Animate dynamic elements inside group
      if (dynamicGroupRef.current) {
        animateWeatherElements(themeType, dynamicGroupRef.current, elapsedTime, delta, windSpeed);
      }

      // Handle Thunderstorm lightning flashes
      if (themeType === 'thunderstorm') {
        handleLightning(elapsedTime, scene);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [themeType, isDay, windSpeed, is3dEnabled, reducedMotion]);

  // Helper to build weather-reactive 3D objects
  function buildWeatherScene(
    type: WeatherThemeType,
    day: boolean,
    group: THREE.Group,
    scene: THREE.Scene
  ) {
    // 1. STARFIELD (Night / Clear Night)
    if (!day || type === 'clear-night' || type === 'partly-cloudy-night') {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 1800;
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);

      const colorChoices = [
        new THREE.Color(0xffffff),
        new THREE.Color(0xa5f3fc),
        new THREE.Color(0xfef08a),
        new THREE.Color(0xc7d2fe),
      ];

      for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 120;
        const y = (Math.random() - 0.5) * 80;
        const z = -20 - Math.random() * 60;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const col = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;

        sizes[i] = Math.random() * 2.2 + 0.6;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Simple round particle texture via canvas
      const starCanvas = document.createElement('canvas');
      starCanvas.width = 32;
      starCanvas.height = 32;
      const ctx = starCanvas.getContext('2d');
      if (ctx) {
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
      }
      const starTex = new THREE.CanvasTexture(starCanvas);

      const starMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        map: starTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const starPoints = new THREE.Points(starGeo, starMat);
      starPoints.name = 'starfield';
      group.add(starPoints);

      // Add 3D Glowing Moon Sphere
      const moonGeo = new THREE.SphereGeometry(3.2, 32, 32);
      const moonMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x94a3b8,
        emissiveIntensity: 0.25,
      });
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);
      moonMesh.position.set(12, 8, -10);
      moonMesh.name = 'moon';
      group.add(moonMesh);

      // Moon halo glow sprite
      const haloCanvas = document.createElement('canvas');
      haloCanvas.width = 64;
      haloCanvas.height = 64;
      const hCtx = haloCanvas.getContext('2d');
      if (hCtx) {
        const grad = hCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
        grad.addColorStop(0.5, 'rgba(147, 197, 253, 0.15)');
        grad.addColorStop(1, 'rgba(147, 197, 253, 0)');
        hCtx.fillStyle = grad;
        hCtx.fillRect(0, 0, 64, 64);
      }
      const haloTex = new THREE.CanvasTexture(haloCanvas);
      const haloMat = new THREE.SpriteMaterial({
        map: haloTex,
        color: 0xbae6fd,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.7,
      });
      const haloSprite = new THREE.Sprite(haloMat);
      haloSprite.position.set(12, 8, -9.8);
      haloSprite.scale.set(14, 14, 1);
      group.add(haloSprite);
    }

    // 2. 3D SUN (Clear Day)
    if (day && (type === 'clear-day' || type === 'partly-cloudy-day')) {
      const sunGroup = new THREE.Group();
      sunGroup.name = 'sun_group';
      sunGroup.position.set(11, 7, -8);

      const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({
        color: 0xfffbeb,
      });
      const sunMesh = new THREE.Mesh(sunGeo, sunMat);
      sunGroup.add(sunMesh);

      // Corona radiant flare
      const coronaCanvas = document.createElement('canvas');
      coronaCanvas.width = 128;
      coronaCanvas.height = 128;
      const cCtx = coronaCanvas.getContext('2d');
      if (cCtx) {
        const grad = cCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 245, 200, 0.95)');
        grad.addColorStop(0.25, 'rgba(253, 224, 71, 0.45)');
        grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.15)');
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, 128, 128);
      }
      const coronaTex = new THREE.CanvasTexture(coronaCanvas);
      const coronaMat = new THREE.SpriteMaterial({
        map: coronaTex,
        color: 0xffedd5,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.85,
      });
      const coronaSprite = new THREE.Sprite(coronaMat);
      coronaSprite.scale.set(22, 22, 1);
      sunGroup.add(coronaSprite);

      // Ambient solar dust particles
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = 200;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 40;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        size: 0.4,
        color: 0xfef08a,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      dustPoints.name = 'solar_dust';
      sunGroup.add(dustPoints);

      group.add(sunGroup);
    }

    // 3. 3D VOLUMETRIC CLOUDS (Cloudy / Overcast / Rain / Storm / Fog)
    if (
      type === 'partly-cloudy-day' ||
      type === 'partly-cloudy-night' ||
      type === 'overcast' ||
      type === 'fog' ||
      type === 'rain' ||
      type === 'heavy-rain' ||
      type === 'thunderstorm' ||
      type === 'drizzle' ||
      type === 'snow' ||
      type === 'heavy-snow'
    ) {
      const cloudsGroup = new THREE.Group();
      cloudsGroup.name = 'clouds_group';

      const cloudPuffCount = type === 'overcast' || type === 'thunderstorm' ? 38 : 18;
      const cloudGeo = new THREE.DodecahedronGeometry(2.4, 2);

      const isStorm = type === 'thunderstorm' || type === 'heavy-rain';
      const cloudColor = isStorm
        ? new THREE.Color(0x1e293b)
        : day
        ? new THREE.Color(0xf8fafc)
        : new THREE.Color(0x334155);

      const cloudMat = new THREE.MeshStandardMaterial({
        color: cloudColor,
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: isStorm ? 0.88 : 0.72,
      });

      for (let i = 0; i < cloudPuffCount; i++) {
        const mesh = new THREE.Mesh(cloudGeo, cloudMat);
        const spreadX = (Math.random() - 0.5) * 45;
        const spreadY = Math.random() * 12 - 2;
        const spreadZ = -5 - Math.random() * 20;
        const scale = 1.2 + Math.random() * 2.0;

        mesh.position.set(spreadX, spreadY, spreadZ);
        mesh.scale.set(scale * 1.5, scale * 0.9, scale * 1.2);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        // Store random drift speed
        mesh.userData = {
          driftSpeed: 0.2 + Math.random() * 0.4,
          baseY: spreadY,
          bobPhase: Math.random() * Math.PI * 2,
        };

        cloudsGroup.add(mesh);
      }
      group.add(cloudsGroup);
    }

    // 4. 3D RAIN PARTICLES
    if (type === 'rain' || type === 'heavy-rain' || type === 'drizzle' || type === 'thunderstorm') {
      const rainCount = type === 'heavy-rain' || type === 'thunderstorm' ? 2200 : type === 'drizzle' ? 700 : 1400;
      const rainGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(rainCount * 3);
      const velocities = new Float32Array(rainCount);

      for (let i = 0; i < rainCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = Math.random() * 40 - 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
        velocities[i] = (type === 'drizzle' ? 14 : 32) + Math.random() * 16;
      }

      rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      rainGeo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

      // Rain streak texture
      const rainCanvas = document.createElement('canvas');
      rainCanvas.width = 8;
      rainCanvas.height = 64;
      const rCtx = rainCanvas.getContext('2d');
      if (rCtx) {
        const grad = rCtx.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0, 'rgba(186, 230, 253, 0.9)');
        grad.addColorStop(0.7, 'rgba(125, 211, 252, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        rCtx.fillStyle = grad;
        rCtx.fillRect(0, 0, 8, 64);
      }
      const rainTex = new THREE.CanvasTexture(rainCanvas);

      const rainMat = new THREE.PointsMaterial({
        size: type === 'drizzle' ? 0.7 : 1.4,
        map: rainTex,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const rainPoints = new THREE.Points(rainGeo, rainMat);
      rainPoints.name = 'rain_system';
      group.add(rainPoints);
    }

    // 5. 3D SNOW PARTICLES
    if (type === 'snow' || type === 'heavy-snow') {
      const snowCount = type === 'heavy-snow' ? 1800 : 900;
      const snowGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(snowCount * 3);
      const speeds = new Float32Array(snowCount);
      const sways = new Float32Array(snowCount);

      for (let i = 0; i < snowCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = Math.random() * 35 - 12;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
        speeds[i] = 2.5 + Math.random() * 3.5;
        sways[i] = Math.random() * Math.PI * 2;
      }

      snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      snowGeo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
      snowGeo.setAttribute('sway', new THREE.BufferAttribute(sways, 1));

      const snowCanvas = document.createElement('canvas');
      snowCanvas.width = 32;
      snowCanvas.height = 32;
      const sCtx = snowCanvas.getContext('2d');
      if (sCtx) {
        const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.4, 'rgba(240, 249, 255, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 32, 32);
      }
      const snowTex = new THREE.CanvasTexture(snowCanvas);

      const snowMat = new THREE.PointsMaterial({
        size: 0.9,
        map: snowTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const snowPoints = new THREE.Points(snowGeo, snowMat);
      snowPoints.name = 'snow_system';
      group.add(snowPoints);
    }

    // 6. THUNDER LIGHTNING LIGHT
    if (type === 'thunderstorm') {
      const lightningLight = new THREE.PointLight(0xa5f3fc, 0, 100);
      lightningLight.position.set(0, 15, -5);
      scene.add(lightningLight);
      lightningLightRef.current = lightningLight;
    }
  }

  // Animation controller for specific entities
  function animateWeatherElements(
    type: WeatherThemeType,
    group: THREE.Group,
    elapsed: number,
    delta: number,
    wind: number
  ) {
    const windFactor = Math.max(0.4, Math.min(3.0, wind / 18));

    // Animate Clouds
    const clouds = group.getObjectByName('clouds_group') as THREE.Group | undefined;
    if (clouds) {
      clouds.children.forEach((puff) => {
        puff.position.x += (puff.userData.driftSpeed || 0.3) * windFactor * delta;
        if (puff.position.x > 32) {
          puff.position.x = -32;
        }
        if (puff.userData.baseY !== undefined) {
          puff.position.y = puff.userData.baseY + Math.sin(elapsed * 0.8 + puff.userData.bobPhase) * 0.35;
        }
      });
    }

    // Animate Rain
    const rain = group.getObjectByName('rain_system') as THREE.Points | undefined;
    if (rain) {
      const posAttr = rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const velAttr = rain.geometry.getAttribute('velocity') as THREE.BufferAttribute;
      const count = posAttr.count;

      const windDrift = (wind / 40) * 12;

      for (let i = 0; i < count; i++) {
        let y = posAttr.getY(i);
        let x = posAttr.getX(i);
        const vel = velAttr.getX(i);

        y -= vel * delta;
        x += windDrift * delta;

        if (y < -16) {
          y = 22;
          x = (Math.random() - 0.5) * 60;
        }
        posAttr.setY(i, y);
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;
    }

    // Animate Snow
    const snow = group.getObjectByName('snow_system') as THREE.Points | undefined;
    if (snow) {
      const posAttr = snow.geometry.getAttribute('position') as THREE.BufferAttribute;
      const spdAttr = snow.geometry.getAttribute('speed') as THREE.BufferAttribute;
      const swayAttr = snow.geometry.getAttribute('sway') as THREE.BufferAttribute;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        let y = posAttr.getY(i);
        let x = posAttr.getX(i);
        const spd = spdAttr.getX(i);
        const sway = swayAttr.getX(i);

        y -= spd * delta;
        x += Math.sin(elapsed * 1.5 + sway) * 0.8 * delta + (wind / 30) * 2 * delta;

        if (y < -15) {
          y = 20;
          x = (Math.random() - 0.5) * 50;
        }
        posAttr.setY(i, y);
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;
    }

    // Animate Sun Group
    const sun = group.getObjectByName('sun_group');
    if (sun) {
      sun.rotation.z = elapsed * 0.04;
      const dust = sun.getObjectByName('solar_dust') as THREE.Points | undefined;
      if (dust) {
        dust.rotation.y = elapsed * 0.08;
      }
    }

    // Animate Stars subtle twinkle
    const starfield = group.getObjectByName('starfield') as THREE.Points | undefined;
    if (starfield) {
      starfield.rotation.y = elapsed * 0.003;
    }
  }

  // Realistic random lightning generator
  function handleLightning(elapsed: number, scene: THREE.Scene) {
    if (!lightningLightRef.current) return;

    if (elapsed > nextLightningTimeRef.current) {
      // Trigger new lightning flash
      lightningLightRef.current.intensity = 5.0 + Math.random() * 4.0;
      lightningLightRef.current.position.set((Math.random() - 0.5) * 30, 12, (Math.random() - 0.5) * 15);
      lightningDurationRef.current = elapsed + 0.18 + Math.random() * 0.15;
      nextLightningTimeRef.current = elapsed + 4.0 + Math.random() * 8.0;

      // Draw procedural bolt geometry
      if (lightningMeshRef.current) {
        scene.remove(lightningMeshRef.current);
        lightningMeshRef.current.geometry.dispose();
      }

      const boltPoints: THREE.Vector3[] = [];
      let currentPt = new THREE.Vector3(
        lightningLightRef.current.position.x,
        lightningLightRef.current.position.y,
        lightningLightRef.current.position.z
      );
      boltPoints.push(currentPt.clone());

      for (let s = 0; s < 7; s++) {
        currentPt = currentPt.clone().add(
          new THREE.Vector3((Math.random() - 0.5) * 4.5, -(Math.random() * 3.5 + 2.0), (Math.random() - 0.5) * 3.0)
        );
        boltPoints.push(currentPt);
      }

      const boltGeo = new THREE.BufferGeometry().setFromPoints(boltPoints);
      const boltMat = new THREE.LineBasicMaterial({
        color: 0xe0f2fe,
        linewidth: 3,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const boltMesh = new THREE.Line(boltGeo, boltMat);
      scene.add(boltMesh);
      lightningMeshRef.current = boltMesh;
    }

    // Fade out lightning
    if (elapsed > lightningDurationRef.current) {
      if (lightningLightRef.current.intensity > 0) {
        lightningLightRef.current.intensity = Math.max(0, lightningLightRef.current.intensity - 0.4);
      }
      if (lightningMeshRef.current) {
        scene.remove(lightningMeshRef.current);
        lightningMeshRef.current.geometry.dispose();
        lightningMeshRef.current = null;
      }
    }
  }

  return (
    <div
      ref={containerRef}
      id="three-weather-canvas-container"
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    />
  );
};
