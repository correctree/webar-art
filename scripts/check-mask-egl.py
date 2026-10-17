import ctypes as c,json,os,sys
os.environ['EGL_PLATFORM']='surfaceless'
e=c.CDLL('libEGL.so.1');e.eglGetDisplay.restype=c.c_void_p;e.eglGetDisplay.argtypes=[c.c_void_p];d=e.eglGetDisplay(None)
def egl(name,result,args):
 f=getattr(e,name);f.restype=result;f.argtypes=args;return f
I=c.c_int;P=c.c_void_p
assert egl('eglInitialize',I,[P,P,P])(d,None,None)
assert egl('eglBindAPI',I,[c.c_uint])(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038);config=P();n=I()
assert egl('eglChooseConfig',I,[P,P,P,I,P])(d,attrs,c.byref(config),1,c.byref(n)) and n.value
surf=egl('eglCreatePbufferSurface',P,[P,P,P])(d,config,(I*5)(0x3057,64,0x3056,64,0x3038))
ctx=egl('eglCreateContext',P,[P,P,P,P])(d,config,None,(I*3)(0x3098,2,0x3038));assert ctx
assert egl('eglMakeCurrent',I,[P,P,P,P])(d,surf,surf,ctx)
e.eglGetProcAddress.restype=P;e.eglGetProcAddress.argtypes=[c.c_char_p]
def gl(name,result,*args):return c.CFUNCTYPE(result,*args)(e.eglGetProcAddress(name.encode()))
create=gl('glCreateShader',c.c_uint,c.c_uint);source=gl('glShaderSource',None,c.c_uint,I,c.POINTER(c.c_char_p),P);compile=gl('glCompileShader',None,c.c_uint);status=gl('glGetShaderiv',None,c.c_uint,c.c_uint,P);log=gl('glGetShaderInfoLog',None,c.c_uint,I,P,P)
def shader(kind,text):
 s=create(kind);raw=c.c_char_p(text.encode());source(s,1,c.byref(raw),None);compile(s);ok=I();status(s,0x8B81,c.byref(ok));buf=c.create_string_buffer(8192);log(s,8192,None,buf);assert ok.value,buf.value.decode();return s
cp=gl('glCreateProgram',c.c_uint);attach=gl('glAttachShader',None,c.c_uint,c.c_uint);link=gl('glLinkProgram',None,c.c_uint);pstatus=gl('glGetProgramiv',None,c.c_uint,c.c_uint,P);use=gl('glUseProgram',None,c.c_uint);loc=gl('glGetUniformLocation',I,c.c_uint,c.c_char_p);u1=gl('glUniform1f',None,I,c.c_float);um=gl('glUniformMatrix4fv',None,I,I,c.c_ubyte,P)
gen=gl('glGenBuffers',None,I,P);bind=gl('glBindBuffer',None,c.c_uint,c.c_uint);data=gl('glBufferData',None,c.c_uint,c.c_ssize_t,P,c.c_uint);aloc=gl('glGetAttribLocation',I,c.c_uint,c.c_char_p);enable=gl('glEnableVertexAttribArray',None,c.c_uint);pointer=gl('glVertexAttribPointer',None,c.c_uint,I,c.c_uint,c.c_ubyte,I,P)
clearcolor=gl('glClearColor',None,c.c_float,c.c_float,c.c_float,c.c_float);clear=gl('glClear',None,c.c_uint);draw=gl('glDrawArrays',None,c.c_uint,I,I);read=gl('glReadPixels',None,I,I,I,I,c.c_uint,c.c_uint,P)
# Packed-alpha shader uses an opaque white 1x1 texture.
tgen=gl('glGenTextures',None,I,P);tbind=gl('glBindTexture',None,c.c_uint,c.c_uint);timage=gl('glTexImage2D',None,c.c_uint,I,I,I,I,I,c.c_uint,c.c_uint,P);tparam=gl('glTexParameteri',None,c.c_uint,c.c_uint,I)
t=I();tgen(1,c.byref(t));tbind(0x0DE1,t.value);rgba=(c.c_ubyte*4)(255,255,255,255);timage(0x0DE1,0,0x1908,1,1,0,0x1908,0x1401,rgba);tparam(0x0DE1,0x2801,0x2600);tparam(0x0DE1,0x2800,0x2600)
identity=(c.c_float*16)(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);vertices=(c.c_float*18)(-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,-.5,0,.5,.5,0,-.5,.5,0);results=[]
for index,s in enumerate(json.load(open(sys.argv[1] if len(sys.argv)>1 else '/tmp/ararart-mask-shaders.json'))):
 p=cp();attach(p,shader(0x8B31,s['vertexShader']));attach(p,shader(0x8B30,s['fragmentShader']));link(p);ok=I();pstatus(p,0x8B82,c.byref(ok));assert ok.value;use(p)
 for name in ['modelMatrix','modelViewMatrix','projectionMatrix','artMaskInverse']:um(loc(p,name.encode()),1,0,identity)
 b=I();gen(1,c.byref(b));bind(0x8892,b.value);data(0x8892,c.sizeof(vertices),vertices,0x88E4);a=aloc(p,b'position');enable(a);pointer(a,3,0x1406,0,0,None)
 for shape in [1,2,3]:
  for outside in [0,1]:
   for name,value in [('artMaskActive',1),('artMaskType',shape),('artMaskOutside',outside)]:u1(loc(p,name.encode()),value)
   clearcolor(0,0,0,0);clear(0x4000);draw(4,0,6);center=(c.c_ubyte*4)();corner=(c.c_ubyte*4)();read(32,32,1,1,0x1908,0x1401,center);read(18,18,1,1,0x1908,0x1401,corner)
   assert bool(center[3])==(outside==0) and bool(corner[3])==(outside==1),(index,shape,outside,list(center),list(corner))
   results.append([index,shape,outside])
print(json.dumps({'passed':len(results),'renderer':'headless EGL/GLES2 Mesa','checks':results}))
