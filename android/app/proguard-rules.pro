# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class kotlinx.serialization.json.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.folio.cv.**$$serializer { *; }
-keepclassmembers class com.folio.cv.** { *** Companion; }
-keepclasseswithmembers class com.folio.cv.** { kotlinx.serialization.KSerializer serializer(...); }
