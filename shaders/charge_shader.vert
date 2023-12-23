attribute vec4 vPosition;

uniform float uTableWidth;
uniform float uTableHeight;

varying float fCharge;

void main()
{
    gl_PointSize = 45.0;
    gl_Position.xy = vPosition.xy/vec2(uTableWidth/2.0, uTableHeight/2.0);  
    gl_Position.zw = vec2(0.0, 1.0);

    fCharge = vPosition.z;
}

