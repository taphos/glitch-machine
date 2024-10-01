import {startSound, updateSound} from "./sound.js";
import {WebGLRenderer, PerspectiveCamera, Scene, Object3D, Fog, AmbientLight, Color, DirectionalLight, TextureLoader, VideoTexture} from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {TexturePass} from "three/examples/jsm/postprocessing/TexturePass.js";
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RenderPixelatedPass} from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import {VideoEffectPass} from "./VideoEffectPass.js";
import {generatePerlinNoise} from "@vicimpa/perlin-noise";
import * as THREE from "three";
import { VertexTangentsHelper } from "three/examples/jsm/helpers/VertexTangentsHelper.js";
import { VertexNormalsHelper } from "three/examples/jsm/helpers/VertexNormalsHelper.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

// Initialize renderer and composer
// Composer contains passes (passes are like photoshop layers)
const animationListeners = [];
const renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
const composer = new EffectComposer(renderer);

// Create and add passes to composer
createDickRenderPass();
// await createCameraVideoPass();
// const glitchPass = createGlitchPass();
// const smileTexturePass = createSmileTexturePass();

// Once in 3 seconds make glitch pass "go wild" with probability 50%
// Also show smile texture synchronously
setInterval(() => {
 //   glitchPass.goWild = Math.random() < 0.5;
 //   smileTexturePass.opacity = glitchPass.goWild ? 0.2 : 0.001;
}, 3000);

// Once a second update sound generator values, in sync with glitch pass
setInterval(() => {
 //   updateSound(glitchPass.goWild ? Math.random() * 0.5 + 0.5 : Math.random() * 0.2);
}, 1000);

// Called when disclaimer Okey button is pressed
export function start() {
    renderer.setAnimationLoop((time) => {
        animationListeners.forEach(l => l(time));
        composer.render();
    });
  //  startSound();
    return renderer.domElement;
};

function createDickRenderPass() {
    

				const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
				camera.position.z = 400;

				const scene = new THREE.Scene();

				const light = new THREE.PointLight();
				light.position.set( 200, 100, 150 );
				scene.add( light );

				scene.add( new THREE.PointLightHelper( light, 15 ) );

				const gridHelper = new THREE.GridHelper( 400, 40, 0x0000ff, 0x808080 );
				gridHelper.position.y = - 150;
				gridHelper.position.x = - 150;
				scene.add( gridHelper );

				const polarGridHelper = new THREE.PolarGridHelper( 200, 16, 8, 64, 0x0000ff, 0x808080 );
				polarGridHelper.position.y = - 150;
				polarGridHelper.position.x = 200;
				scene.add( polarGridHelper );

				const loader = new GLTFLoader();
                let  vnh , vth;
				loader.load( 'assets/bonnie_penis.glb', function ( gltf ) {

                    console.log(gltf);
					const mesh = gltf.scene.children[ 0 ];

					// mesh.geometry.computeTangents(); // generates bad data due to degenerate UVs

					const group = new THREE.Group();
					group.scale.multiplyScalar( 50 );
					scene.add( group );

					// To make sure that the matrixWorld is up to date for the boxhelpers
					group.updateMatrixWorld( true );

					group.add( mesh );

					vnh = new VertexNormalsHelper( mesh, 5 );
					scene.add( vnh );

					vth = new VertexTangentsHelper( mesh, 5 );
					scene.add( vth );

					scene.add( new THREE.BoxHelper( mesh ) );

					const wireframe = new THREE.WireframeGeometry( mesh.geometry );
					let line = new THREE.LineSegments( wireframe );
					line.material.depthTest = false;
					line.material.opacity = 0.25;
					line.material.transparent = true;
					line.position.x = 4;
					group.add( line );
					scene.add( new THREE.BoxHelper( line ) );

					const edges = new THREE.EdgesGeometry( mesh.geometry );
					line = new THREE.LineSegments( edges );
					line.material.depthTest = false;
					line.material.opacity = 0.25;
					line.material.transparent = true;
					line.position.x = - 4;
					group.add( line );
					scene.add( new THREE.BoxHelper( line ) );

					scene.add( new THREE.BoxHelper( group ) );
					scene.add( new THREE.BoxHelper( scene ) );


				} );

				//

    composer.addPass(new RenderPass(scene, camera));

    // On every frame, rotate dick in sync with time value
    animationListeners.push((time) => {

            time = - performance.now() * 0.0003;

            camera.position.x = 400 * Math.cos( time );
            camera.position.z = 400 * Math.sin( time );
            camera.lookAt( scene.position );

            light.position.x = Math.sin( time * 1.7 ) * 300;
            light.position.y = Math.cos( time * 1.5 ) * 400;
            light.position.z = Math.cos( time * 1.3 ) * 300;

            if ( vnh ) vnh.update();
            if ( vth ) vth.update();

    
    });
    // Update virtual camera aspect on browser window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
}

async function createCameraVideoPass() {
    const videoStream = await navigator.mediaDevices.getUserMedia({video: true});
    const video = document.createElement('video');
    video.playsInline = true;
    video.srcObject = videoStream;
    video.play();
    const videoTexture = new VideoTexture(video);
    let pass = new VideoEffectPass(videoTexture, 0.7);
    composer.addPass(pass);

    // Generate array of perlin noise values
    const perlinNoise = generatePerlinNoise(1000, 1, {octaveCount: 5});
    // Update pass opacity using perlin noise values, in sync with time
    animationListeners.push((time) => {
        pass.opacity = perlinNoise[Math.trunc(time * 0.1) % perlinNoise.length] * 1.5;
    })
}

function createGlitchPass() {
    const glitchPass = new GlitchPass();
    glitchPass.goWild = true;
    composer.addPass(glitchPass);
    return glitchPass;
}

function createSmileTexturePass() {
    let pass = new TexturePass(new TextureLoader().load("assets/icon.png"), 0.1);
    composer.addPass(pass);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);
    return pass;
}

// Update renderer and composer size if browser window is resized
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
});
