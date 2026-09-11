# aron-cdm — sunucu tarafli PlayReady CDM proxy (KULLANILMIYOR)

Bu sunucu artik kullanilmiyor. Netflix DRM islemleri dogrudan Android
tarafinda Rave logblob3 protokolu uzerinden yapiliyor (`RaveLogblob.kt`).

Eski akis `.prd` dosyasi gerektiriyordu. Yeni akis Rave'in sunucu tarafli
PlayReady CDM'sini logblob3 uzerinden kullaniyor, yerel `.prd` gereksiz.
