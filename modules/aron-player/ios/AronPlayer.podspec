Pod::Spec.new do |s|
  s.name           = 'AronPlayer'
  s.version        = '1.0.0'
  s.summary        = 'Aron Parti yerel oynatici'
  s.description    = 'AVPlayer tabanli yerel oynatici ve manifest koprusu'
  s.author         = 'Aron'
  s.homepage       = 'https://rave.io'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
