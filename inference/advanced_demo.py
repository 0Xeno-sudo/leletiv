"""Synthetic fixtures with known measurements; never derived from patient images."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import shift
from advanced_io import save_volume

def make_demo(kind,directory,model=False):
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    paths={};a=np.diag([2.,2.,2.,1.]);a[:3,3]=[-64,-64,-48]
    x,y,z=np.indices((64,64,48));body=((x-32)/25)**2+((y-32)/20)**2<1
    ct=np.where(body,25+10*np.sin(x/7)+5*np.cos(z/3),-1000).astype(np.float32)
    ball=(x-24)**2+(y-29)**2+(z-24)**2<7**2
    second=(x-43)**2+(y-36)**2+(z-24)**2<4**2
    mask=np.where(ball,1,np.where(second,2,0)).astype(np.uint16)
    options={'researchConfirmed':True,'title':'Szintetikus ellenőrző példa','huConfirmed':True,'alignmentConfirmed':True,'heightCm':170,'synthetic':True}
    def save(role,data,affine=a): paths[role]=directory/save_volume(directory,'input-'+role,data,affine)
    if kind=='longitudinal':
        anatomical=ct+np.where(ball,80,0)+np.where(second,40,0)
        save('baseline',anatomical);save('baseline_mask',mask)
        follow=mask.copy();follow[ball]=0;follow[(x-24)**2+(y-29)**2+(z-24)**2<5**2]=1
        moving_affine=a.copy();moving_affine[0,3]+=4
        save('followup1',anatomical,moving_affine);save('followup1_mask',follow,moving_affine)
    elif kind=='body':
        ct[((x-32)**2+(y-38)**2<4**2)]=600
        save('ct',ct)
        if not model:
            from totalsegmentator.map_to_binary import class_map
            names={v:k for k,v in class_map['total'].items()}
            organs=np.zeros(ct.shape,np.uint16);organs[(x-32)**2+(y-38)**2<4**2]=names['vertebrae_L3'];organs[ball]=names['liver'];organs[second]=names['kidney_left']
            tissue=np.zeros(ct.shape,np.uint16)
            radius=((x-32)/25)**2+((y-32)/20)**2
            tissue[body&(radius>.72)]=3;tissue[(radius>.5)&(radius<=.72)]=1;tissue[(radius>.28)&(radius<=.5)]=2
            save('organs',organs);save('tissue',tissue)
        options['syntheticModelRun']=model
    elif kind=='pet':
        suv=np.where(body,.7,0).astype(np.float32);suv[ball]=5;suv[second]=9
        save('ct',ct);save('pet',suv)
        options.update(petUnits='SUVbw',tracer='FDG',suvThreshold=2.5,minimumMl=.1)
    elif kind=='pathology':
        image=Image.new('RGB',(512,384),(250,245,240));draw=ImageDraw.Draw(image)
        for row in range(8):
            for col in range(11):
                xx=30+col*43;yy=30+row*44
                draw.ellipse((xx-7,yy-8,xx+7,yy+8),fill=(95,60,25) if (row+col)%3==0 else (74,59,140))
        paths['slide']=directory/'input-slide.png';image.save(paths['slide'])
        options.update(micronsPerPixel=.5,roiX=0,roiY=0,roiWidth=512,roiHeight=384,tumorRoiConfirmed=True,nucleusThreshold=.035,dabThreshold=.08,minNucleusArea=12,maxNucleusArea=200)
    elif kind=='mri':
        base=np.where(body,700+20*np.sin(x),0).astype(np.float32)
        adc=np.where(ball,.0007,.0012);bvals=[0,500,1000]
        dwi=np.stack([base*np.exp(-b*adc) for b in bvals],axis=3).astype(np.float32)
        time=np.arange(20);curve=np.exp(-((time-10)/3)**2)*12
        concentration=np.where(ball,2,1)
        dsc=(base[:,:,:,None]*np.exp(-.03*concentration[:,:,:,None]*curve)).astype(np.float32)
        normal=np.where(second,1,0).astype(np.uint16)
        save('reference',base);save('dwi',dwi);save('dsc',dsc);save('roi',mask);save('normal_mask',normal)
        options.update(bValues=bvals,motionCorrected=True,echoTimeMs=30,timeStepSec=1.5,baselineFrames=3,bolusStart=3,bolusEnd=18)
    else: raise ValueError('Unknown fixture')
    return paths,options
