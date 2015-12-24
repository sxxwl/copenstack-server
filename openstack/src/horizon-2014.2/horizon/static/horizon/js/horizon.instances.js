horizon.instances = {
  user_decided_length: false,
  networks_selected: [],
  networks_available: [],

  getConsoleLog: function(via_user_submit) {
    var form_element = $("#tail_length"),
      data;

    if (!via_user_submit) {
      via_user_submit = false;
    }

    if(this.user_decided_length) {
      data = $(form_element).serialize();
    } else {
      data = "length=35";
    }

    $.ajax({
      url: $(form_element).attr('action'),
      data: data,
      method: 'get',
      success: function(response_body) {
        $('pre.logs').text(response_body);
      },
      error: function(response) {
        if(via_user_submit) {
          horizon.clearErrorMessages();
          horizon.alert('error', gettext('There was a problem communicating with the server, please try again.'));
        }
      }
    });
  },

  /*
   * Gets the html select element associated with a given
   * network id for network_id.
   **/
  get_network_element: function(network_id) {
    return $('li > label[for^="id_network_' + network_id + '"]');
  },

  /*
   * Initializes an associative array of lists of the current
   * networks.
   **/
  init_network_list: function () {
    horizon.instances.networks_selected = [];
    horizon.instances.networks_available = [];
    $(this.get_network_element("")).each(function () {
      var $this = $(this);
      var $input = $this.children("input");
      var name = horizon.escape_html($this.text().replace(/^\s+/, ""));
      var network_property = {
        "name": name,
        "id": $input.attr("id"),
        "value": $input.attr("value")
      };
      if ($input.is(":checked")) {
        horizon.instances.networks_selected.push(network_property);
      } else {
        horizon.instances.networks_available.push(network_property);
      }
    });
  },

  /*
   * Generates the HTML structure for a network that will be displayed
   * as a list item in the network list.
   **/
  generate_network_element: function(name, id, value) {
    var $li = $('<li>');
    $li.attr('name', value).html(name + '<em class="network_id">(' + value + ')</em><a href="#" class="btn btn-primary"></a>');
    return $li;
  },

  /*
   * Generates the HTML structure for the Network List.
   **/
  generate_networklist_html: function() {
    var self = this;
    var updateForm = function() {
      var lists = $("#networkListId li").attr('data-index',100);
      var active_networks = $("#selected_network > li").map(function(){
        return $(this).attr("name");
      });
      $("#networkListId input:checkbox").removeAttr('checked');
      active_networks.each(function(index, value){
        $("#networkListId input:checkbox[value=" + value + "]")
          .prop('checked', true)
          .parents("li").attr('data-index',index);
      });
      $("#networkListId ul").html(
        lists.sort(function(a,b){
          if( $(a).data("index") < $(b).data("index")) { return -1; }
          if( $(a).data("index") > $(b).data("index")) { return 1; }
          return 0;
        })
      );
    };
    $("#networkListSortContainer").show();
    $("#networkListIdContainer").hide();
    self.init_network_list();
    // Make sure we don't duplicate the networks in the list
    $("#available_network").empty();
    $.each(self.networks_available, function(index, value){
      $("#available_network").append(self.generate_network_element(value.name, value.id, value.value));
    });
    // Make sure we don't duplicate the networks in the list
    $("#selected_network").empty();
    $.each(self.networks_selected, function(index, value){
      $("#selected_network").append(self.generate_network_element(value.name, value.id, value.value));
    });
    // $(".networklist > li").click(function(){
    //   $(this).toggleClass("ui-selected");
    // });
    $(".networklist > li > a.btn").click(function(e){
      var $this = $(this);
      e.preventDefault();
      e.stopPropagation();
      if($this.parents("ul#available_network").length > 0) {
        $this.parent().appendTo($("#selected_network"));
      } else if ($this.parents("ul#selected_network").length > 0) {
        $this.parent().appendTo($("#available_network"));
      }
      updateForm();
    });
    if ($("#networkListId > div.form-group.error").length > 0) {
      var errortext = $("#networkListId > div.form-group.error").find("span.help-block").text();
      $("#selected_network_label").before($('<div class="dynamic-error">').html(errortext));
    }
    $(".networklist").sortable({
      connectWith: "ul.networklist",
      placeholder: "ui-state-highlight",
      distance: 5,
      start:function(e,info){
        $("#selected_network").addClass("dragging");
      },
      stop:function(e,info){
        $("#selected_network").removeClass("dragging");
        updateForm();
      }
    }).disableSelection();
  },

  workflow_init: function(modal) {
    // Initialise the drag and drop network list
    horizon.instances.generate_networklist_html();
  }
};

horizon.addInitFunction(function () {
  $(document).on('submit', '#tail_length', function (evt) {
    horizon.instances.user_decided_length = true;
    horizon.instances.getConsoleLog(true);
    evt.preventDefault();
  });

  /* Launch instance workflow */

  // Handle field toggles for the Launch Instance source type field
  function update_launch_source_displayed_fields (field) {
    var $this = $(field),
      base_type = $this.val();

    $this.closest(".form-group").nextAll().hide();

    switch(base_type) {
      case "image_id":
        $("#id_image_id").closest(".form-group").show();
        break;

      case "instance_snapshot_id":
        $("#id_instance_snapshot_id").closest(".form-group").show();
        break;

      case "volume_id":
        $("#id_volume_id, #id_delete_on_terminate").closest(".form-group").show();
        break;

      case "volume_image_id":
        $("#id_image_id, #id_volume_size, #id_device_name, #id_delete_on_terminate")
          .closest(".form-group").show();
        break;

      case "volume_snapshot_id":
        $("#id_volume_snapshot_id, #id_device_name, #id_delete_on_terminate")
          .closest(".form-group").show();
        break;
    }
  }

  $(document).on('change', '.workflow #id_source_type', function (evt) {
    update_launch_source_displayed_fields(this);
  });

  $('.workflow #id_source_type').change();
  horizon.modals.addModalInitFunction(function (modal) {
    $(modal).find("#id_source_type").change();
  });

  /*
   Update the device size value to reflect minimum allowed
   for selected image and flavor
   */
  function update_device_size() {
    var volume_size = horizon.Quota.getSelectedFlavor().disk;
    var image = horizon.Quota.getSelectedImage();

    if(image !== undefined) {
      if(image.min_disk > volume_size) {
        volume_size = image.min_disk;
      }
    }

    // Make sure the new value is >= the minimum allowed (1GB)
    if(volume_size < 1) {
      volume_size = 1;
    }

    $("#id_volume_size").val(volume_size);
  }
  
  function my_update_device_size(){
	  var flavor_table = $('.workflow .flavor_table');
	  var set_flavor_table_visible = function(is_cserver){
		  flavor_table.find('#flavor_os').closest('tr').toggle(is_cserver);
		  flavor_table.find('#flavor_name').closest('tr').toggle(!is_cserver);
		  flavor_table.find('#flavor_disk').closest('tr').toggle(!is_cserver);
		  flavor_table.find('#flavor_ephemeral').closest('tr').toggle(!is_cserver);
		  flavor_table.find('#flavor_disk_total').closest('tr').toggle(!is_cserver);
	  }
	  var clear_flavor_table_val = function(){
		  flavor_table.find('#flavor_os').html('');
		  flavor_table.find('#flavor_name').html('');
		  flavor_table.find('#flavor_disk').html('');
		  flavor_table.find('#flavor_ephemeral').html('');
		  flavor_table.find('#flavor_disk_total').html('');
		  flavor_table.find('#flavor_vcpus').html('');
		  flavor_table.find('#flavor_ram').html('');
	  }
	  if($('.workflow #id_template_id').is(':visible')) {
		  clear_flavor_table_val();
		  var availability_zone_info = $('.workflow #id_availability_zone_info').val();
		  var json_availability_zone_info = JSON.parse(availability_zone_info);
		  if( ! json_availability_zone_info) return;
		  var zone = $('.workflow #id_availability_zone').val();
		  var template_id_obj = $('.workflow #id_template_id');
		  var template_id = template_id_obj.val();
		  var templates = json_availability_zone_info[zone]['templates'];
		  set_flavor_table_visible(true);
		  for(var i = 0; i < templates.length; i ++){
			  var template = templates[i];
			  if(template_id == template['id']){
				  var os = template['os_type'];
				  var cpu = template['cpu'];
				  var memory = template['memory'];
				  flavor_table.find('#flavor_os').html(os);
				  flavor_table.find('#flavor_vcpus').html(cpu);
				  flavor_table.find('#flavor_ram').html(memory);
				  $('.workflow #id_flavor_vcpus').val(cpu);
				  $('.workflow #id_flavor_ram').val(memory);
			  }
		  }
	  }else{
		  set_flavor_table_visible(false);
		  update_device_size();
	  }
  }

  $(document).on('change', '.workflow #id_flavor', function (evt) {
	  if(!$('.workflow #id_template_id').is(':visible'))
		  update_device_size();
  });

  $(document).on('change', '.workflow #id_image_id', function (evt) {
	  if(!$('.workflow #id_template_id').is(':visible'))
		  update_device_size();
  });
  
  $(document).on('change', '.workflow #id_template_id', function (evt) {
    my_update_device_size();
  });
  
  	/** zhangdebo 2015年10月31日 */
	function zone_onchange(){
		var zone = $('.workflow #id_availability_zone').val();
		var template_id_obj = $('.workflow #id_template_id');
		var cluster_id_obj = $('.workflow #id_cluster_id');
		var flavor_obj = $('.workflow #id_flavor');
		var source_type_obj = $('.workflow #id_source_type');
		var image_id_obj = $('.workflow #id_image_id');
		cluster_id_obj.find('option').remove();
		var not_cserver = function(){
			template_id_obj.closest('.form-group ').hide();
			cluster_id_obj.closest('.form-group ').hide();
			flavor_obj.closest('.form-group ').show();
			source_type_obj.closest('.form-group ').show();
			if(source_type_obj.children(":selected").val() == 'image_id'){
				image_id_obj.closest('.form-group ').show();
			}
		};
		var is_cserver = function(){
			template_id_obj.closest('.form-group ').show();
			cluster_id_obj.closest('.form-group ').show();
			flavor_obj.closest('.form-group ').hide();
			source_type_obj.closest('.form-group ').hide();
			image_id_obj.closest('.form-group ').hide();
			source_type_obj.find('option[value="image_id"]').attr('selected',true);
		};
		if(!zone) {
			not_cserver();
		}else{
			var availability_zone_info = $('.workflow #id_availability_zone_info').val();
			if(!availability_zone_info){
				not_cserver();
			}
			var json_info = JSON.parse(availability_zone_info);
			if(json_info[zone] && json_info[zone]['vtype'] == 'cserver'){
				for(var i = 0; i < json_info[zone]['clusters'].length; i ++ ){
					var id = json_info[zone]['clusters'][i]['id'];
					var name = json_info[zone]['clusters'][i]['name'];
					cluster_id_obj.append($('<option value="' + id + '">' + name + '</option>'));
				}
				is_cserver();
			}else{
				not_cserver();
			}
		}
	}
	function cluster_onchange(){
		var zone = $('.workflow #id_availability_zone').val();
		var template_id_obj = $('.workflow #id_template_id');
		var availability_zone_info = $('.workflow #id_availability_zone_info').val();
		var json_info = JSON.parse(availability_zone_info);
		var cluster_id_obj = $('.workflow #id_cluster_id');
		var cluster_id = cluster_id_obj.val();
		template_id_obj.find('option').remove();
		if(json_info[zone] && json_info[zone]['vtype'] == 'cserver'){
			for(var i = 0; i < json_info[zone]['templates'].length; i ++ ){
				var cid = json_info[zone]['templates'][i]['cluster_id'];
				if(cid == cluster_id){
					var id = json_info[zone]['templates'][i]['id'];
					var name = json_info[zone]['templates'][i]['name'];
					template_id_obj.append($('<option value="' + id + '">' + name + '</option>'));
				}
			}
		}
	}
	/** zhangdebo 2015年10月31日 */
	$(document).on('change', '.workflow #id_availability_zone', function (evt) {
		zone_onchange();
		cluster_onchange();
		my_update_device_size();
	});
	$(document).on('focus', '.workflow #id_availability_zone', function (evt) {
		zone_onchange();
		cluster_onchange();
		my_update_device_size();
	});
	$(document).on('change', '.workflow #id_cluster_id', function (evt) {
		cluster_onchange();
		my_update_device_size();
	});
	$(document).on('focus', '.workflow #id_cluster_id', function (evt) {
		cluster_onchange();
		my_update_device_size();
	});
  

  horizon.instances.decrypt_password = function(encrypted_password, private_key) {
    var crypt = new JSEncrypt();
    crypt.setKey(private_key);
    return crypt.decrypt(encrypted_password);
  };

  $(document).on('change', '#id_private_key_file', function (evt) {
    var file = evt.target.files[0];
    var reader = new FileReader();
    if (file) {
      reader.onloadend = function(event) {
        $("#id_private_key").val(event.target.result);
      };
      reader.onerror = function(event) {
        horizon.clearErrorMessages();
        horizon.alert('error', gettext('Could not read the file'));
      };
      reader.readAsText(file);
    }
    else {
      horizon.clearErrorMessages();
      horizon.alert('error', gettext('Could not decrypt the password'));
    }
  });
  /*
    The font-family is changed because with the default policy the major I
    and minor the l cannot be distinguished.
  */
  $(document).on('show', '#password_instance_modal', function (evt) {
    $("#id_decrypted_password").css("font-family","monospace");
    $("#id_decrypted_password").css("cursor","text");
    $("#id_encrypted_password").css("cursor","text");
    $("#id_keypair_name").css("cursor","text");
  });

  $(document).on('click', '#decryptpassword_button', function (evt) {
    encrypted_password = $("#id_encrypted_password").val();
    private_key = $('#id_private_key').val();
    if (!private_key) {
      evt.preventDefault();
      $(this).closest('.modal').modal('hide');
    }
    else {
      if (private_key.length > 0) {
        evt.preventDefault();
        decrypted_password = horizon.instances.decrypt_password(encrypted_password, private_key);
        if (decrypted_password === false || decrypted_password === null) {
          horizon.clearErrorMessages();
          horizon.alert('error', gettext('Could not decrypt the password'));
        }
        else {
          $("#id_decrypted_password").val(decrypted_password);
          $("#decryptpassword_button").hide();
        }
      }
    }
  });
});