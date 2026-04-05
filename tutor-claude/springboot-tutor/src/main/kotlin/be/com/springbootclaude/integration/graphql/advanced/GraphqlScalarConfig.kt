package be.com.springbootclaude.integration.graphql.advanced

import graphql.scalars.ExtendedScalars
import graphql.schema.idl.RuntimeWiring
import org.springframework.context.annotation.Configuration
import org.springframework.graphql.execution.RuntimeWiringConfigurer

/**
 * GraphqlScalarConfig: 커스텀 Scalar 등록
 *
 * 학습 포인트:
 * - GraphQL 기본 스칼라는 Int, String, Boolean, Float, ID뿐입니다.
 * - Long 같은 타입은 커스텀 스칼라로 등록해야 합니다.
 */
@Configuration
class GraphqlScalarConfig : RuntimeWiringConfigurer {

    override fun configure(builder: RuntimeWiring.Builder) {
        builder.scalar(ExtendedScalars.GraphQLLong)
    }
}
