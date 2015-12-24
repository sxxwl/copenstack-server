# Copyright 2012,  Nachi Ueno,  NTT MCL,  Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

from django.utils.translation import ugettext_lazy as _
from openstack_dashboard.openstack.common.log import policy_is

from horizon import tables
from openstack_dashboard import api
from openstack_dashboard.dashboards.project.routers import tables as r_tables


class DeleteRouter(r_tables.DeleteRouter):
    redirect_url = "horizon:admin:routers:index"
    policy_rules = (("network", "delete_router"),)

    def delete(self, request, obj_id):
        search_opts = {'device_owner': 'network:router_interface',
                       'device_id': obj_id}
        ports = api.neutron.port_list(request, **search_opts)
        for port in ports:
            api.neutron.router_remove_interface(request, obj_id,
                                                port_id=port.id)
        super(DeleteRouter, self).delete(request, obj_id)

    def allowed(self, request, router=None):
        return policy_is(request.user.username ,'admin', 'sysadmin')


class EditRouter(r_tables.EditRouter):
    url = "horizon:admin:routers:update"


class UpdateRow(tables.Row):
    ajax = True

    def get_data(self, request, router_id):
        router = api.neutron.router_get(request, router_id)
        return router


class RoutersTable(r_tables.RoutersTable):
    tenant = tables.Column("tenant_name", verbose_name=_("Project"))
    name = tables.Column("name",
                         verbose_name=_("Name"),
                         link="horizon:admin:routers:detail")

    class Meta:
        name = "Routers"
        verbose_name = _("Routers")
        status_columns = ["status"]
        row_class = UpdateRow
        table_actions = (DeleteRouter,)
        row_actions = (EditRouter, DeleteRouter,)
        Columns = ('tenant', 'name', 'status', 'distributed', 'ext_net')


    def get_rows(self):
        """Return the row data for this table broken out by columns."""
        rows = []
        policy = policy_is(self.request.user.username, 'sysadmin', 'admin')
        for datum in self.filtered_data:
            row = self._meta.row_class(self, datum)
            if self.get_object_id(datum) == self.current_item_id:
                self.selected = True
                row.classes.append('current_selected')
            if not policy:
                del row.cells['actions']
            rows.append(row)
        return rows

    def get_columns(self):
        if not(policy_is(self.request.user.username, 'sysadmin', 'admin')):
            self.columns['actions'].attrs = {'class':'hide'}
        return self.columns.values()