"""Offline TotalSegmentator adapter. Never opens a user configuration file."""
from pathlib import Path
import os, sys, socket

MODEL_ROOT=Path(__file__).parent/'models'/'total'

def configure():
    os.environ['TOTALSEG_HOME_DIR']=str(MODEL_ROOT)
    os.environ['TOTALSEG_WEIGHTS_PATH']=str(MODEL_ROOT/'nnunet'/'results')
    import totalsegmentator.config as config
    # All settings are in memory. No account, license or telemetry configuration is read.
    settings={'send_usage_stats':False,'statistics_disclaimer_shown':True,'prediction_counter':0}
    config.setup_totalseg=lambda:settings
    config.get_config=lambda:settings
    config.get_config_key=lambda key:settings.get(key)
    config.set_config_key=lambda key,value:settings.update({key:value})
    config.increase_prediction_counter=lambda:settings
    config.send_usage_stats=lambda *args,**kwargs:None
    import totalsegmentator.python_api as api
    def installed(task_id):
        if task_id!=297 or not list((MODEL_ROOT/'nnunet'/'results').glob('Dataset297*/**/checkpoint_final.pth')):
            raise RuntimeError('Install the pinned open model before analysis.')
    api.download_pretrained_weights=installed
    # Fail closed if an upstream dependency attempts a network connection during inference.
    def offline(*args,**kwargs): raise RuntimeError('Network is disabled during local inference.')
    socket.create_connection=offline
    original_connect=socket.socket.connect
    def local_connect(sock,address):
        if sock.family==socket.AF_UNIX: return original_connect(sock,address)
        return offline()
    socket.socket.connect=local_connect
    return api

def main():
    from advanced_models import verify
    verify('total')
    api=configure()
    import torch
    torch.set_num_threads(4)
    api.totalsegmentator(Path(sys.argv[1]),Path(sys.argv[2]),task='total',fast=True,ml=True,device='cpu',quiet=True,nr_thr_resamp=1,nr_thr_saving=1)

if __name__=='__main__': main()
