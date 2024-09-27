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

const animationListeners = [];
const renderer = new WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
const composer = new EffectComposer(renderer);

createDickRenderPass();
await createCameraVideoPass();
const glitchPass = createGlitchPass();
const smileTexturePass = createSmileTexturePass();

setInterval(() => {
    glitchPass.goWild = Math.random() < 0.5;
    smileTexturePass.opacity = glitchPass.goWild ? 0.2 : 0.001;
}, 3000);

setInterval(() => {
    updateSound(glitchPass.goWild ? Math.random() * 0.5 + 0.5 : Math.random() * 0.2);
}, 1000);

export function start() {
    renderer.setAnimationLoop((time) => {
        animationListeners.forEach(l => l(time));
        composer.render();
    });
    startSound();
    return renderer.domElement;
};

function createDickRenderPass() {
    const camera = new PerspectiveCamera(3, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    const scene = new Scene();
    scene.fog = new Fog("#000000", 1, 1000);
    scene.background = new Color("#90FF0A");

    const object = new Object3D();
    scene.add(object);
    new GLTFLoader().load('assets/bonnie_penis.glb', (m) => {
        m.scene.position.y = -2.5;
        m.scene.position.z = -1;
        m.scene.scale.set(4, 4, 4);
        object.add(m.scene);
    })
    scene.add(new AmbientLight("#CCCCCC"));
    const light = new DirectionalLight("#FF1493", 3);
    light.position.set(1, 1, 1);
    scene.add(light);
    composer.addPass(new RenderPixelatedPass(8 * devicePixelRatio, scene, camera));

    animationListeners.push((time) => {
        object.rotation.y = time * 0.001;
    });
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });
    return camera;
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

    const perlinNoise = generatePerlinNoise(1000, 1, {octaveCount: 5});
    animationListeners.push((time) => {
        pass.opacity = perlinNoise[Math.trunc(time * 0.1) % perlinNoise.length] * 1.5;
    })
    return pass;
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

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
});
