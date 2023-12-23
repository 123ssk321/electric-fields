precision highp float;

varying float fCharge;

void main() {
    
  vec2 fragmentPosition = 2.0*gl_PointCoord - 1.0;
  float d = length(fragmentPosition);
  float distanceSqrd = d * d ; 
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  
  if(d<0.8){
    if(fCharge > 0.0) {

      // Dont paint frag if it belongs to plus sign  
      if(fragmentPosition.x <=0.25  && fragmentPosition.x >=-0.25 && fragmentPosition.y <= 0.07 && fragmentPosition.y >= -0.07
          || fragmentPosition.x <=0.07  && fragmentPosition.x >=-0.07 && fragmentPosition.y <= 0.25 && fragmentPosition.y >= -0.25){
        discard;
      }
      color.y = 0.1/distanceSqrd;
    } else {
        // Dont paint frag if it belongs to minus sign 
        if(fragmentPosition.x <=0.25  && fragmentPosition.x >=-0.25 && fragmentPosition.y <= 0.07 && fragmentPosition.y >= -0.07){
          discard;
        }
        color.x = 0.1/distanceSqrd;
    }
    gl_FragColor = color;
  } else {
      discard;
  }

}
