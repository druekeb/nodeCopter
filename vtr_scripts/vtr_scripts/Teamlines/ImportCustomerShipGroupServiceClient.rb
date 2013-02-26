#!/usr/bin/env ruby
require 'ImportCustomerShipGroupServiceDriver.rb'

endpoint_url = ARGV.shift
obj = ImportCustomerShipGroup_.new(endpoint_url)

# run ruby with -d to see SOAP wiredumps.
obj.wiredump_dev = STDERR if $DEBUG

# SYNOPSIS
#   importCustomerShipGroup(parameters)
#
# ARGS
#   parameters      ImportCustomerShipGroup - {http://webservice.ejb.vesseltracker.com/}importCustomerShipGroup
#
# RETURNS
#   parameters      ImportCustomerShipGroupResponse - {http://webservice.ejb.vesseltracker.com/}importCustomerShipGroupResponse
#
parameters = nil
puts obj.importCustomerShipGroup(parameters)


