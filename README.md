## aframe-godrays-postprocess -component

[![Version](http://img.shields.io/npm/v/aframe-godrays-postprocess -component.svg?style=flat-square)](https://npmjs.org/package/aframe-godrays-postprocess -component)
[![License](http://img.shields.io/npm/l/aframe-godrays-postprocess -component.svg?style=flat-square)](https://npmjs.org/package/aframe-godrays-postprocess -component)

Simple postprocessing component to encapsulate godrays for aframe

For [A-Frame](https://aframe.io).

### API

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|          |             |               |

### Installation

#### Browser

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.4.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-godrays-postprocess -component/dist/aframe-godrays-postprocess -component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity godrays-postprocess ="foo: bar"></a-entity>
  </a-scene>
</body>
```

<!-- If component is accepted to the Registry, uncomment this. -->
<!--
Or with [angle](https://npmjs.com/package/angle/), you can install the proper
version of the component straight into your HTML file, respective to your
version of A-Frame:

```sh
angle install aframe-godrays-postprocess -component
```
-->

#### npm

Install via npm:

```bash
npm install aframe-godrays-postprocess -component
```

Then require and use.

```js
require('aframe');
require('aframe-godrays-postprocess -component');
```
