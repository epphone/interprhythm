# interprhythm

A General MIDI Clip Interpolator designed for linear drum loops for use within Ableton Live.



## Overview

interprhythm is a pair of Max for Live MIDI devices that interpolate between four drum beats. Each source beat sits at a corner of an XY pad; moving the pointer across the pad synthesizes new beats in the spaces between them, played back in real time following Live's transport.

The interpolation is non-linear: rather than crossfading between the source loops, interprhythm trains a multilayer perceptron (MLP) regressor from the [FluCoMa](https://flucoma.org) library on the four beats, learning a mapping from the XY plane to complete note events. Any position on the pad is then regressed into new note positions, pitches, velocities and durations.

interprhythm is designed for linear drum loops, beats in which no two hits ever sound simultaneously, and it keeps beats unquantized at Live's native 960 PPQN (parts per quarter note) resolution.



## Requirements

- [Ableton Live 12](https://www.ableton.com/en/live/) with Max for Live (Max 9)
- The [FluCoMa package](https://learn.flucoma.org/installation/max/) for Max

## Installation

1. Install the FluCoMa package for Max. The easiest way is Max's built-in Package Manager (search for "Fluid Corpus Manipulation"); see the [official installation guide](https://learn.flucoma.org/installation/max/) for details and platform-specific paths.
2. Clone this repository or download it as a ZIP.
3. Drag `interprhythm.amxd` and `interprhythm_trainer.amxd` from the repository onto any MIDI track. No further installation is required.

**Note:** both devices depend on helper `.maxpat` patches and `.js` scripts, which ship in the repository and must remain in the same directory as the `.amxd` files.

## Repository contents


| File                             | Description                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `interprhythm.amxd`              | Playback device: loads a trained model and performs the interpolation        |
| `interprhythm_trainer.amxd`      | Trainer patch: reads the four beats and trains the interpolator              |
| `demo/interprhythm_template.als` | Demo Live set showing intended use within a project                          |
| `img/`                           | Screenshots and GIFs used in this README                                     |
| Helper `.maxpat` and `.js` files | Internal patches and scripts; must stay in the same directory as the devices |


## How it works

The workflow has three stages: prepare, train, perform.

1. **Prepare.** Four beats are placed as MIDI clips in the first four Session view slots of a MIDI track.
2. **Train.** The trainer patch extracts the MIDI material from the four clips and trains an MLP regressor on it. Saving writes a folder containing two `.json` files: the trained weights and the source note positions.
3. **Perform.** The playback device loads that folder through its dropfolder window. The XY pad position acts as the query point for the regressor, which outputs the note events of the interpolated beat. The device plays them in real time, following Live's transport.

### Corner mapping

The Session slots map onto the XY pad corners like this:

```text
        top
    2 ┌──────────┐ 4
      │          │
      │   pad    │
      │          │
    1 └──────────┘ 3
        bottom
```

Slot 1 is the bottom-left beat, slot 2 the top-left, slot 3 the bottom-right and slot 4 the top-right. Parking the pointer exactly on a corner reproduces the corresponding source beat; everything in between is new material synthesized by the regressor.

Because the beats remain unquantized, at a resolution of 960 PPQN, the source material's timing feel is perceptually lossless.

## Usage

### 1. Prepare the beats

- Create a MIDI track in Session view.
- Record or draw four MIDI clips (ex. : linear drumming beats) and place them in the track's first four slots (one clip per slot, slots 1 to 4).
- The beats do not need to be quantized; their unquantized positions are captured at a precision of 960 PPQN.
- **Warning:** all beats, regardless of their length, have their note positions normalized to a single 4/4 measure synchronized with Live's transport. This is a limitation in the way beats are conceived: beats of different lengths are always treated as one 4/4 bar.

### 2. Train

1. Drop `interprhythm_trainer.amxd` onto the MIDI track.
2. Click **Gut Clips** to extract the note material (positions, pitches, velocities, durations) from the four clips.
3. Click **Train** to fit the MLP regressor to the extracted material.
4. Click **Save** and choose a location. This writes a folder containing two `.json` files: the trained weights and the source positions.

### 3. Perform

1. Drop `interprhythm.amxd` onto a MIDI track, followed by the instrument that will play the beats.
2. Drag the folder saved by the trainer onto the device's dropfolder window.
3. Move the pointer across the XY pad and play. The interpolated beat is output in real time, following Live's transport.



## Demo Live set

`demo/interprhythm_template.als` is a ready-made Live set showing interprhythm within a project. The devices are already included in the first two tracks, named **Trainer** and **Player**. Open it in Live 12, load your own beats or train new ones, and explore the range between the four corners with the XY pad.

## Notes

- interprhythm is designed for linear drum loops: beats in which no two hits occur simultaneously. This keeps every note an independent event, which is what the regression builds on.
- The tool could in theory also work on monophonic melodic note sequences, although pitch interpolation adds some uncertainty or quirkiness to the results.
- Timing is unquantized throughout, at a precision of 960 PPQN.

- Clip cropping in the trainer: all referenced clips will be cropped so that the tool knows where each beat ends, in order to process them for normalization.

## Credits

- [FluCoMa, the Fluid Corpus Manipulation project](https://flucoma.org), whose machine learning objects for Max power the interpolation. Installation guide in the [FluCoMa documentation](https://learn.flucoma.org/installation/max/).
- Built with [Max for Live](https://cycling74.com/products/max-for-live) (Cycling '74) for [Ableton Live](https://www.ableton.com/en/live/).

Created by Antoine Goudreau ([@epphone](https://github.com/epphone)).

## License

Released under the [GNU General Public License v3](LICENSE).