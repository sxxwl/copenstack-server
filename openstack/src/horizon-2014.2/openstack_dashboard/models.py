from django.db import models

class apply(models.Model):
    user_name = models.CharField(max_length=255)
    project_name = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    image_id = models.CharField(max_length=255)
    flavor_id = models.CharField(max_length=255)
    custom_script = models.CharField(max_length=255)
    keypair_id = models.CharField(max_length=255)
    security_group_ids = models.CharField(max_length=255)
    dev_mapping_1 = models.CharField(max_length=255,null=True)
    dev_mapping_2 = models.CharField(max_length=255,null=True)
    nics = models.CharField(max_length=255)
    avail_zone = models.CharField(max_length=255)
    count = models.CharField(max_length=255)
    admin_pass = models.CharField(max_length=255)
    disk_config = models.CharField(max_length=255,null=True)
    config_drive = models.CharField(max_length=255,null=True)
    status = models.CharField(max_length=255)
    info = models.CharField(max_length=255)
    show_is = models.BooleanField(default=True)
    create_date = models.DateTimeField(auto_now_add=True)
    meta = models.TextField()
    
class log(models.Model):
    user_name = models.CharField(max_length=255)
    role_name = models.CharField(max_length=255)
    message =  models.CharField(max_length=255)
    create_date = models.DateTimeField(auto_now_add=True)

class alarmpolicy(models.Model):
    name = models.CharField(max_length=255)
    zone = models.CharField(max_length=255)
    type = models.CharField(max_length=255)
    hosts_id = models.TextField()
    hosts_name = models.TextField()
    cpu_threshold = models.IntegerField()
    mem_threshold = models.IntegerField()
    disk_threshold = models.IntegerField()
    duration = models.IntegerField()
    alarm_way = models.CharField(max_length=255)
    policys_id = models.TextField()
    enabled = models.BooleanField(default=False)
    create_user = models.CharField(max_length=255)
    create_date = models.DateTimeField(auto_now_add=True)
    
class applydisk(models.Model):
    name = models.CharField(max_length=255)
    user_name = models.CharField(max_length=255)
    project_name = models.CharField(max_length=255)
    size = models.CharField(max_length=255)
    description = models.CharField(max_length=255,null=True)
    type = models.CharField(max_length=255,null=True)
    snapshot_id = models.CharField(max_length=255,null=True)
    image_id = models.CharField(max_length=255,null=True)
    metadata = models.CharField(max_length=255,null=True)
    az = models.CharField(max_length=255,null=True)
    volume_id = models.CharField(max_length=255,null=True)
    status = models.CharField(max_length=255)
    create_date = models.DateTimeField(auto_now_add=True)
    
class treatedalarm(models.Model):
    event_id = models.CharField(max_length=100)