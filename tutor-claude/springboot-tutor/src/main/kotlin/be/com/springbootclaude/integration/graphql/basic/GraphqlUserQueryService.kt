package be.com.springbootclaude.integration.graphql.basic

import be.com.springbootclaude.basic.service.UserService
import be.com.springbootclaude.integration.graphql.shared.GraphqlUser
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * GraphqlUserQueryService: GraphQL 전용 사용자 조회 서비스
 */
@Service
@Transactional(readOnly = true)
class GraphqlUserQueryService(
    private val userService: UserService
) {

    fun getUserById(id: Long): GraphqlUser {
        val response = userService.getUserById(id)
        return GraphqlUser.from(response)
    }

    fun getUserByEmail(email: String): GraphqlUser {
        val response = userService.getUserByEmail(email)
        return GraphqlUser.from(response)
    }
}
