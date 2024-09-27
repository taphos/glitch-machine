import {startSound, updateSound} from "./sound.js";

import * as THREE from 'three';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {TexturePass} from "three/examples/jsm/postprocessing/TexturePass.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RenderPixelatedPass} from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import {VideoEffectPass} from "./VideoEffectPass.js"
import {generatePerlinNoise} from "@vicimpa/perlin-noise"

let camera, scene, renderer, composer;
let object, light;

let glitchPass;

const perlinNoise = generatePerlinNoise(1000, 1, {octaveCount: 5});

renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );

export const start = () => {
    renderer.setAnimationLoop( animate );
    startSound();
    return renderer.domElement;
};

camera = new THREE.PerspectiveCamera( 3, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 20;

scene = new THREE.Scene();
scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
scene.background = new THREE.Color("#90FF0A");


object = new THREE.Object3D();
scene.add( object );

new GLTFLoader().load('bonnie_penis.glb', (m) => {
    m.scene.position.y = -2.5;
    m.scene.position.z = -1;
    m.scene.scale.set(4, 4, 4);
    object.add(m.scene);
})

scene.add( new THREE.AmbientLight( 0xcccccc ) );

light = new THREE.DirectionalLight( "#FF1493", 3 );
light.position.set( 1, 1, 1 );
scene.add( light );

composer = new EffectComposer( renderer );
composer.addPass(new RenderPixelatedPass(8 * devicePixelRatio, scene, camera));

const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
const video = document.createElement('video');
video.playsInline = true;
video.srcObject = videoStream;
video.play();
const videoTexture = new THREE.VideoTexture(video);
let videoPass = new VideoEffectPass(videoTexture, 0.7);
composer.addPass(videoPass);

glitchPass = new GlitchPass();
glitchPass.goWild = true;
composer.addPass( glitchPass );

let texturePass = new TexturePass(new THREE.TextureLoader().load("icon.png"), 0.1);
composer.addPass(texturePass);

const outputPass = new OutputPass();
composer.addPass( outputPass );

window.addEventListener( 'resize', onWindowResize );

setInterval(() => {
    glitchPass.goWild = Math.random() < 0.5;
    texturePass.opacity = glitchPass.goWild ? 0.2 : 0.001;
}, 3000);
setInterval(() => {
    updateSound(glitchPass.goWild ? Math.random() * 0.5 + 0.5 : Math.random() * 0.2);
}, 1000);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    composer.setSize( window.innerWidth, window.innerHeight );
}

function animate(time) {
    videoPass.opacity = perlinNoise[Math.trunc(time * 0.1) % perlinNoise.length] * 1.5;
    object.rotation.y = time * 0.001;
    composer.render();
}
