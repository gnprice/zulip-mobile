version = "0.0.2"

Pod::Spec.new do |s|
  s.name = "zulip"
  s.version = version
  s.summary = "Some pieces of the Zulip mobile app."
  s.authors = "Kandra Labs, Inc., and contributors"
  s.license = "Apache License, Version 2.0"
  s.homepage = "https://zulip.com/"
  s.source = { :git => "" } # https://github.com/zulip/zulip-mobile.git", :tag => 'ignoreme-${version}' }

  s.resources = 'static/assets/fonts/*.ttf'
end
