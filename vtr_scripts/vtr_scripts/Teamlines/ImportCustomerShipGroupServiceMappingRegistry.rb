require 'ImportCustomerShipGroupService.rb'
require 'soap/mapping'

module ImportCustomerShipGroupServiceMappingRegistry
  EncodedRegistry = ::SOAP::Mapping::EncodedRegistry.new
  LiteralRegistry = ::SOAP::Mapping::LiteralRegistry.new
  NsWebserviceEjbVesseltrackerCom = "http://webservice.ejb.vesseltracker.com/"

  EncodedRegistry.register(
    :class => ImportCustomerShipGroup,
    :schema_type => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "importCustomerShipGroup"),
    :schema_element => [
      ["arg0", ["SOAP::SOAPInt", XSD::QName.new(nil, "arg0")]],
      ["arg1", ["CustomerShipGroupInfo[]", XSD::QName.new(nil, "arg1")], [0, nil]]
    ]
  )

  EncodedRegistry.register(
    :class => CustomerShipGroupInfo,
    :schema_type => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "customerShipGroupInfo"),
    :schema_element => [
      ["imoNumbers", ["SOAP::SOAPLong[]", XSD::QName.new(nil, "imoNumbers")], [0, nil]]
    ],
    :schema_attribute => {
      XSD::QName.new(nil, "groupname") => "SOAP::SOAPString"
    }
  )

  EncodedRegistry.register(
    :class => ImportCustomerShipGroupResponse,
    :schema_type => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "importCustomerShipGroupResponse"),
    :schema_element => []
  )

  LiteralRegistry.register(
    :class => ImportCustomerShipGroup,
    :schema_type => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "importCustomerShipGroup"),
    :schema_element => [
      ["arg0", ["SOAP::SOAPInt", XSD::QName.new(nil, "arg0")]],
      ["arg1", ["CustomerShipGroupInfo[]", XSD::QName.new(nil, "arg1")], [0, nil]]
    ]
  )

  LiteralRegistry.register(
    :class => CustomerShipGroupInfo,
    :schema_type => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "customerShipGroupInfo"),
    :schema_element => [
      ["imoNumbers", ["SOAP::SOAPLong[]", XSD::QName.new(nil, "imoNumbers")], [0, nil]]
    ],
    :schema_attribute => {
      XSD::QName.new(nil, "groupname") => "SOAP::SOAPString"
    }
  )

  LiteralRegistry.register(
    :class => ImportCustomerShipGroupResponse,
    :schema_type => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "importCustomerShipGroupResponse"),
    :schema_element => []
  )

  LiteralRegistry.register(
    :class => ImportCustomerShipGroup,
    :schema_name => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "importCustomerShipGroup"),
    :schema_element => [
      ["arg0", ["SOAP::SOAPInt", XSD::QName.new(nil, "arg0")]],
      ["arg1", ["CustomerShipGroupInfo[]", XSD::QName.new(nil, "arg1")], [0, nil]]
    ]
  )

  LiteralRegistry.register(
    :class => ImportCustomerShipGroupResponse,
    :schema_name => XSD::QName.new(NsWebserviceEjbVesseltrackerCom, "importCustomerShipGroupResponse"),
    :schema_element => []
  )
end
