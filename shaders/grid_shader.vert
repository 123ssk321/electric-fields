#define TWOPI 6.28318530718
#define COULOMB_CONSTANT 8.987551792e9

attribute vec4 vPosition;

const int MAX_CHARGES = 23;

uniform float uTableWidth;
uniform float uTableHeight;
uniform vec2 uPosition[MAX_CHARGES];
uniform float uCharge[MAX_CHARGES];
uniform int numCharges;

varying vec4 fColor;

// convert angle to hue; returns RGB
// colors corresponding to (angle mod TWOPI):
// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple

vec3 angle_to_hue(float angle) {
  angle /= TWOPI;
  return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f)
{
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.);
}

void main()
{
    gl_PointSize = 4.0;
    vec4 position = vec4(vPosition.xy, 0.0, 1.0);
    vec2 res = vec2(0.0, 0.0);
    
    // Compute position for point vertice if the vertice is not fixed in the grid
    if(vPosition.z == 1.0 && numCharges != 0){
        for(int i = 0; i < MAX_CHARGES; i++) {
            if(i == numCharges){break;}
            vec2 v = uPosition[i] -position.xy;
            res-= (COULOMB_CONSTANT*1.0e-9*uCharge[i]/(pow(length(v), 2.0)))*normalize(v);
        }
        res*= 0.005; 
        float d = length((position.xy + res.xy)-vPosition.xy); 
        if( d >= 0.1){
            position.xy += 0.1*normalize(res.xy);
        } else {
            position.xy += res.xy;
        }
    }
    gl_Position = position/vec4(uTableWidth/2.0, uTableHeight/2.0, 1.0, 1.0);

    fColor = colorize(normalize(res.xy));
    
}