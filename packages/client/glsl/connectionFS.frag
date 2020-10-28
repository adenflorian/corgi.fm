precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uZoom;
uniform vec2 uPan;
uniform vec2 uLineStart;
uniform vec2 uLineEnd;
uniform float uLineControlPointOffset;
uniform vec3 uLineColor;
uniform float uLineThicc;

// TYPES //////////////////////////////////////////////////////////////////////////////////
struct CubicBezierSegment
{
    vec2 A, B;   // Vertices A and B the line is drawn between
	vec2 CA, CB; // Control points for verts A/B control the shape
};

struct BezierLook
{
    vec4 BezierCol;
    vec4 HandleCol;
    vec4 LineCol;
    float BezierThicc;
};
    
struct Hit
{
    float Dist;
    vec4 Col;
};

// SHAPES /////////////////////////////////////////////////////////////////////////////////
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

float sdLineSegment(vec2 p, vec2 a, vec2 b, float halfThicc) {
    vec2 ap = p - a;
    vec2 ab = b - a;
    float h = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0); // project ap onto ab
	return length(ap - ab * h) - halfThicc; // finds length of vec from p to the projection of p onto ab
}

vec2 SampleBezier(CubicBezierSegment seg, float t) {
    // First degree
    vec2 p11 = mix(seg.A, seg.CA, t);
    vec2 p12 = mix(seg.CA, seg.CB, t);
    vec2 p13 = mix(seg.CB, seg.B, t);

    // Second degree
    vec2 p21 = mix(p11, p12, t);
    vec2 p22 = mix(p12, p13, t);

    // Third degree
    return mix(p21, p22, t);
}

// SCENE  /////////////////////////////////////////////////////////////////////////////////
Hit Closest(Hit a, Hit b) {
    // Not sure how to be more performance with this as the ternary operator doesn't support structs :|
    if (a.Dist <= b.Dist) 
    	return a;
    else
        return b;
}

Hit HitSegment(vec2 p, CubicBezierSegment seg, BezierLook look) {
    const int subdivs = 30;
    
    Hit hit;
    hit.Dist = 999999.;
    Hit newHit;

    // Vertices
    // newHit.Col = look.HandleCol;
    //newHit.Dist = sdCircle(p-seg.A, 0.02); hit = Closest(hit, newHit);
    //newHit.Dist = sdCircle(p-seg.B, 0.02); hit = Closest(hit, newHit);
    
    // Control Points
    // newHit.Col = look.HandleCol*0.75;
    // newHit.Dist = sdCircle(p-seg.CA, 0.025); hit = Closest(hit, newHit);
    // newHit.Dist = sdCircle(p-seg.CB, 0.025); hit = Closest(hit, newHit);

    // Lines
    // newHit.Col = look.LineCol;
    // newHit.Dist = sdLineSegment(p, seg.A, seg.CA, 0.); hit = Closest(hit, newHit);
    // newHit.Dist = sdLineSegment(p, seg.B, seg.CB, 0.); hit = Closest(hit, newHit);
    
	// Cubic Bezier
    newHit.Col = look.BezierCol;
    vec2 last = SampleBezier(seg, 0.);
    float subDivsF = float(subdivs);
    int dynamicSubDivs = int(clamp((subDivsF * 6.0) * (uZoom / 4.0), 10.0, subDivsF));
    float dynamicSubDivsF = float(dynamicSubDivs);
    for (int i = 1; i <= subdivs; i++)
    {
        float t = float(i) / dynamicSubDivsF;
        vec2 s = SampleBezier(seg, t);
        
       	newHit.Dist = sdLineSegment(p, last, s, look.BezierThicc);
        hit = Closest(hit, newHit);
        
        last = s;
        if (i >= dynamicSubDivs) break;
    }
    
    return hit;
}

Hit Scene(vec2 p)
{
    BezierLook look;
    look.BezierCol = vec4(uLineColor, 1.0);
    look.LineCol = vec4(1,1,1,1)*0.5;
    look.HandleCol = vec4(1,1,1,1);
    look.BezierThicc = uLineThicc;
    
    vec2 v1 = uLineStart;
    vec2 v2 = uLineEnd;

    float offset = ((sin((uTime + uLineStart.x + uLineStart.y) / 4.0) / 2.0) + 1.0) * uLineControlPointOffset;
    
    CubicBezierSegment seg1;
    seg1.A  = v1;
    seg1.B  = v2;
    seg1.CA = vec2(v1.x + offset, v1.y);
    seg1.CB = vec2(v2.x - offset, v2.y);

    Hit closest;
    closest.Dist = 9999999.;
    return Closest(closest, HitSegment(p, seg1, look));
}

// from http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float udRoundBox(vec2 p, vec2 b, float r) {
    return length(max(abs(p) - b + r, 0.0)) - r;
}

#define connectorWidth 12.0
#define connectorHeight 4.0

void main() {
  vec2 halfRes = 0.5 * uResolution.xy;
  vec2 uv = vec2(
      ((gl_FragCoord.x - halfRes.x) / uZoom) - uPan.x,
      -((gl_FragCoord.y - halfRes.y) / uZoom) - uPan.y
  );

  float iRadius = 4.0;

  vec2 lineOffset = vec2(connectorWidth / 2.0 + 2.0, 0.0);
  vec2 connectorDimensions = vec2(connectorWidth, connectorHeight);

  vec4 lineColor = vec4(uLineColor, 1.0);
  vec4 shadowColor = vec4(vec3(0.01), 0.3);
  float bezierLineDistance = Scene(uv).Dist;
  float connectorSourceDistance = udRoundBox(uv - uLineStart + lineOffset, connectorDimensions, iRadius);
  float connectorTargetDistance = udRoundBox(uv - uLineEnd - lineOffset, connectorDimensions, iRadius);

  float smoothstepEdge0 = 1.5 / uZoom;

  float shadowSize = 8.0;

  vec4 bezierShadow = shadowColor * smoothstep(shadowSize, 0.0, bezierLineDistance);
  float connectorSourceShadow = smoothstep(shadowSize, 0.0, connectorSourceDistance);
  float connectorTargetShadow = smoothstep(shadowSize, 0.0, connectorTargetDistance);
  vec4 connectorShadow = shadowColor * max(connectorSourceShadow, connectorTargetShadow);

  vec4 connectorSource = lineColor * smoothstep(smoothstepEdge0, 0.0, connectorSourceDistance);
  vec4 connectorTarget = lineColor * smoothstep(smoothstepEdge0, 0.0, connectorTargetDistance);
  vec4 bezierLine = mix((lineColor - vec4(0.1,0.1,0.1,0.0)) * smoothstep(smoothstepEdge0, 0.0, bezierLineDistance), vec4(0,0,0,1), connectorShadow.a);

  vec4 col = vec4(0);
  col += max(max(bezierLine, connectorSource), connectorTarget);
  col += max(bezierShadow, connectorShadow) * (1.0 - col.a);
  gl_FragColor = col;
}
