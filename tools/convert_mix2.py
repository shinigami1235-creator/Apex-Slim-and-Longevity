# Converts the Blender renders staged from the laptop into the site formats (WebP stills, clips, curve data).
# Paths are for the Claude workspace: staged files under /mnt/user-data/uploads, repo at /home/claude/apex-slim-and-longevity.
import os, glob, json, shutil
from PIL import Image
src="/mnt/user-data/uploads/Coding Projects/Apex/Apex Slim and Longevity/assets/img/lab/mix2"
dst="/home/claude/apex-slim-and-longevity/assets/img/lab/mix2"
lab="/home/claude/apex-slim-and-longevity/assets/img/lab"
os.makedirs(dst, exist_ok=True); n=0
for p in sorted(glob.glob(src+"/*.png")):
    name=os.path.basename(p)
    if name.startswith("bottle-"):
        Image.open(p).convert("RGB").resize((240,300),Image.LANCZOS).save(os.path.join(lab,name[:-4]+".webp"),"WEBP",quality=88,method=6); n+=1; continue
    out=os.path.join(dst,name[:-4]+".webp")
    if os.path.exists(out) and os.path.getmtime(out)>os.path.getmtime(p): continue
    Image.open(p).convert("RGB").save(out,"WEBP",quality=88,method=6); n+=1
for p in glob.glob(src+"/pour-*-*.mp4")+glob.glob(src+"/pour-*-*.webm"):
    shutil.copy(p, os.path.join(dst,os.path.basename(p))); os.chmod(os.path.join(dst,os.path.basename(p)),0o644); n+=1
c=json.load(open(src+"/mix-curves.json"))
open("/home/claude/apex-slim-and-longevity/assets/js/mix-data.js","w").write("window.MIX="+json.dumps({k:c[k] for k in ("curves","left","right","bottom")},separators=(',',':'))+";\n")
print(n,"written")
