precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uZoom;
uniform vec2 uPan;

// from http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float udRoundBox(vec2 p, vec2 b, float r) {
    return length(max(abs(p) - b + r, 0.0)) - r;
}

void main() {
  // vec2 halfRes = 0.5 * uResolution.xy;
  // vec2 uv = vec2(
  //     ((gl_FragCoord.x - halfRes.x) / uZoom) - uPan.x,
  //     -((gl_FragCoord.y - halfRes.y) / uZoom) - uPan.y
  // );

  // float iRadius = 4.0;

  // vec4 nodeColor = vec4(0.145, 0.145, 0.145, 1.0);

  // nodeColor * smoothstep(1.0 / uZoom, 0.0, udRoundBox(uv - uLineStart + vec2(connectorWidth / 2.0 + 2.0, 0.0), vec2(connectorWidth, connectorHeight), iRadius));

  // gl_FragColor = vec4(0.145, 0.145, 0.845, 1.0);
  gl_FragColor = vec4(0.145, 0.145, 0.145, 1.0);
}
