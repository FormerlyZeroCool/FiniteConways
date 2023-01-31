#include <cinttypes>
#include <vector>
#include <string>
#include <iostream>
class Solution {

public:
    bool isMatch(std::string_view s, std::string_view p) {
        //std::cout<<"s: "<<s<<" p: "<<p<<"\n";
        int64_t i = 0;
        int64_t pi = 0;
        for(; i < s.length() && pi < p.length(); i++, pi++)
        {
        //std::cout<<"for tops: "<<s.substr(i)<<" p: "<<p.substr(pi)<<"\n";
            if(p[pi+1] == '*')
            {
                const char repeated = p[pi];
                while(i < s.length() && (s[i] == repeated || repeated == '.'))
                {
        //std::cout<<"for tops: "<<s.substr(i)<<" p: "<<p.substr(pi)<<"\n";
                    if(p.size() > pi + 2 && isMatch(s.substr(i), p.substr(pi + 2)))
                        return true;
                    i++;
                } 
                pi++;
                i -= (s[i - 1] == repeated);
                //std::cout<<"1\n";
            }
            else if(p[pi] == '.')
            {
                //std::cout<<"2\n";
            }
            else if(p[pi] != s[i])
            {
                //std::cout<<"3\n";
                break;
            }
        
        }
        while(pi < p.length() && p[pi + 1] == '*')
        {
            pi += 2;
        }
        return i >= s.length() && pi >= p.length();
    }
};
int main()
{
    Solution sol;
    std::cout<<sol.isMatch("aaaaaaaaaaaaaaaaaaab", "a*a*b")<<"\n";
}

//if it's a star state we can compound it with right adjacent states that take the same token
//if there is a partial overlap a*. for instance once a non matching char hits
//ensure if adjacent state is not a kleene star operation that once you read in something that is not 