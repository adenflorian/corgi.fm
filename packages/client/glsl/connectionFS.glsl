precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uZoom;
uniform vec2 uPan;
uniform vec2 uLineStart;
uniform vec2 uLineEnd;
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
    

// TRANSFORMATIONS ////////////////////////////////////////////////////////////////////////
mat2 Rotate(float rads) 
{ 
    float s = sin(rads); 
    float c = cos(rads); 
    return mat2(c, s, 
               -s, c); 
}


// SHAPES /////////////////////////////////////////////////////////////////////////////////
float sdCircle(vec2 p, float r)
{
    return length(p) - r;
}
float sdLineSegment(vec2 p, vec2 a, vec2 b, float halfThicc)
{
    vec2 ap = p-a;
    vec2 ab = b-a;
    float h = clamp(dot(ap,ab) /dot(ab,ab), 0.0, 1.0); // project ap onto ab
	return length( ap - ab*h ) - halfThicc; // finds length of vec from p to the projection of p onto ab
}

vec2 SampleBezier(CubicBezierSegment seg, float t)
{
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
Hit Closest(Hit a, Hit b)
{
    // Not sure how to be more performance with this as the ternary operator doesn't support structs :|
    if (a.Dist <= b.Dist) 
    	return a;
    else
        return b;
}

Hit HitSegment(vec2 p, CubicBezierSegment seg, BezierLook look)
{
    const int subdivs = 100;
    
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
    for (int i = 1; i <= subdivs; i++)
    {
        float t = float(i) / float(subdivs);
        vec2 s = SampleBezier(seg, t);
        
       	newHit.Dist = sdLineSegment(p, last, s, look.BezierThicc*0.5);
        hit = Closest(hit, newHit);
        
        last = s;
    }
    
    return hit;
}

vec4 Scene(vec2 p)
{
    BezierLook look;
    look.BezierCol = vec4(uLineColor, 1.0);
    look.LineCol = vec4(1,1,1,1)*0.5;
    look.HandleCol = vec4(1,1,1,1);
    look.BezierThicc = uLineThicc;
    
    vec2 v1 = uLineStart;
    vec2 v2 = uLineEnd;
    // vec2 v1 = vec2(-100, -100);
    // vec2 v2 = vec2(100, 100);
    
    CubicBezierSegment seg1;
    seg1.A  = v1;
    seg1.B  = v2;
    seg1.CA = vec2(v1.x + 100.0, v1.y);//v1 + 0.7* vec2(sin(uTime*.75), cos(uTime*.75));
    seg1.CB = vec2(v2.x - 100.0, v2.y);// - 0.5 * vec2(cos(uTime*1.4), sin(uTime*1.4+1.));
    
    
    Hit closest;
    closest.Dist = 9999999.;
    closest = Closest(closest, HitSegment(p, seg1, look));
    
    return closest.Col * smoothstep(1.0 / uZoom, 0.0, closest.Dist);
}

void main() {
  vec2 uv = vec2(
      ((gl_FragCoord.x - (uResolution.x / 2.0)) / uZoom) - uPan.x,
      -((gl_FragCoord.y - (uResolution.y / 2.0)) / uZoom) - uPan.y
  );

  vec4 col = vec4(0);
  col += Scene(uv);
  gl_FragColor = col;
}
