
#include <iostream>
class Solution_dp {
    int memoized_data[45] {0};
public:
    int climbStairs(int n) {
        int solution = memoized_data[n];
        if(solution)
            return solution;
        if(n > 1)
        {
            solution = climbStairs(n - 2) + climbStairs(n - 1);
        }
        else
        {
            solution++;
        }
        memoized_data[n] = solution;
        return solution;
    }
};
class Solution_it {
public:
    int climbStairs(int n) {
        int last = 0;
        int current = 1;
        int count = 0;
        while(count < n)
        {
            const int temp = last;
            last = current;
            current += temp;
            count++;
        }
        return current;
    }
};
class Solution_rec_accum {
public:
    int climbStairs(int n)
    {
        return climbStairs(n, 0, 1);
    }
    int climbStairs(int n, int last, int current) {
        if(n > 1)
            return climbStairs(n - 1, current, last + current);
        return last + current;
    }
};
int main()
{
    Solution_rec_accum sol;
    std::cout<<sol.climbStairs(6)<<std::endl;
}