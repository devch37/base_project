package game

class KotlinClass {
    @JvmName("filterValidStrings")
    fun List<String>.filterValid() { }
    @JvmName("filterValidInts")
    fun List<Int>.filterValid() { }
}


class AnnotationTest {
    companion object{
        @JvmStatic
        val callList = emptyList<String>()
        @JvmStatic
        fun callTest(): String = "Hello, World!"
    }
}
