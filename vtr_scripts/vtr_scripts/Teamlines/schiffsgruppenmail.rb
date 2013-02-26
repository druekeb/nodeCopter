#!/usr/bin/env ruby
require 'rubygems'
gem 'soap4r'
require "ImportCustomerShipGroupServiceDriver.rb"

info = CustomerShipGroupInfo.new()
info.xmlattr_groupname="Honk"
info.imoNumbers = [1234567,9215634]

driver = ImportCustomerShipGroup_.new
driver.importCustomerShipGroup(ImportCustomerShipGroup.new(1044, [info]))


