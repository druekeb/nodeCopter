require 'xsd/qname'

# {http://webservice.ejb.vesseltracker.com/}importCustomerShipGroup
#   arg0 - SOAP::SOAPInt
#   arg1 - CustomerShipGroupInfo
class ImportCustomerShipGroup
  attr_accessor :arg0
  attr_accessor :arg1

  def initialize(arg0 = nil, arg1 = [])
    @arg0 = arg0
    @arg1 = arg1
  end
end

# {http://webservice.ejb.vesseltracker.com/}customerShipGroupInfo
#   imoNumbers - SOAP::SOAPLong
#   xmlattr_groupname - SOAP::SOAPString
class CustomerShipGroupInfo
  AttrGroupname = XSD::QName.new(nil, "groupname")

  attr_accessor :imoNumbers

  def __xmlattr
    @__xmlattr ||= {}
  end

  def xmlattr_groupname
    __xmlattr[AttrGroupname]
  end

  def xmlattr_groupname=(value)
    __xmlattr[AttrGroupname] = value
  end

  def initialize(imoNumbers = [])
    @imoNumbers = imoNumbers
    @__xmlattr = {}
  end
end

# {http://webservice.ejb.vesseltracker.com/}importCustomerShipGroupResponse
class ImportCustomerShipGroupResponse
  def initialize
  end
end
