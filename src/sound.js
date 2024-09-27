import "tone";
// @ts-ignore
const Tone = window.Tone;

export let updateSound = (v) => {};

export const startSound = () => {
    const noise = new Tone.Noise("brown");
    const pitchedNoiseGain = new Tone.Gain(-1).toDestination();
    const filteredNoiseGain = new Tone.Gain(-1).toDestination();

    // window.onMidi.push(() => {
    //     pitchShift.pitch = midi[17] * 200 - 100;
    //     autoFilter.baseFrequency = midi[18] * 1000;
    //     pitchedNoiseGain.gain.value = midi[1] * 2 - 1;
    //     filteredNoiseGain.gain.value = midi[2] * 2 - 1;
    // });

    //make an autofilter to shape the noise
    const autoFilter = new Tone.AutoFilter({
        frequency: 1,
        baseFrequency: 100
    }).toDestination().start();
    noise.connect(autoFilter);
    autoFilter.connect(filteredNoiseGain);

    const pitchShift = new Tone.PitchShift().toDestination();
    noise.connect(pitchShift);
    pitchShift.connect(pitchedNoiseGain);

    noise.start();
    let source, gain;

    new Tone.Buffer("assets/idling-truck.wav", async buffer => {
        source = new Tone.BufferSource({url: buffer, playbackRate: 0.1, loop: true}).toDestination();

        const reverb = await new Tone.Reverb(5).set({
            wet: 0.5
        }).toDestination().generate();
        source.connect(reverb);
        reverb.toDestination();

        const filter = new Tone.AutoFilter(1 / 30).toDestination();
        filter.start();
        source.connect(filter);

        gain = new Tone.Gain(0.5).toDestination();
        source.connect(gain);
        filter.connect(gain)
        reverb.connect(gain)

        // window.onMidi.push(() => {
        //     source.playbackRate.value = midi[16] * 0.2 + 0.05;
        //     gain.gain.value = midi[0] * 10 - 1;
        // });

        source.start();
    });

    updateSound = (v) => {
        pitchShift.pitch = v * 200 - 100;
        autoFilter.baseFrequency = v * 1000;
        pitchedNoiseGain.gain.value = v * 2 - 1;
        filteredNoiseGain.gain.value = v * 2 - 1;
        if (source) source.playbackRate.value = v * 0.2 + 0.05;
        if (gain) gain.gain.value = v * 10 - 1;
    }
    updateSound(1);
}