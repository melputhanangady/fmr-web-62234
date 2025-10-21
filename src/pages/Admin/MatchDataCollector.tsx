import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  getSuccessfulMatches, 
  storeMatchData, 
  getAllMatchData, 
  getMatchDataStats,
  convertUserToMatchDataProfile,
  MatchDataRecord,
  MatchDataCollection
} from '../../services/matchDataService';
import { Database, Users, TrendingUp, Download, Upload } from 'lucide-react';

const MatchDataCollector: React.FC = () => {
  const [successfulMatches, setSuccessfulMatches] = useState<any[]>([]);
  const [storedMatchData, setStoredMatchData] = useState<MatchDataRecord[]>([]);
  const [stats, setStats] = useState<MatchDataCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    relationshipStatus: 'dating',
    satisfactionScore: '',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.uid) {
      loadData();
    }
  }, [currentUser?.uid]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matches, matchData, matchStats] = await Promise.all([
        getSuccessfulMatches(),
        getAllMatchData(),
        getMatchDataStats()
      ]);
      
      setSuccessfulMatches(matches);
      setStoredMatchData(matchData);
      setStats(matchStats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load match data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match: any) => {
    setSelectedMatch(match);
    setShowForm(true);
  };

  const handleSubmitMatchData = async () => {
    if (!selectedMatch) return;

    try {
      setProcessing(true);
      
      const user1Profile = convertUserToMatchDataProfile(
        selectedMatch.user1Id, 
        selectedMatch.user1Data
      );
      const user2Profile = convertUserToMatchDataProfile(
        selectedMatch.user2Id, 
        selectedMatch.user2Data
      );

      const success = await storeMatchData(
        selectedMatch.user1Id,
        selectedMatch.user2Id,
        user1Profile,
        user2Profile,
        formData.relationshipStatus,
        formData.satisfactionScore ? parseInt(formData.satisfactionScore) : undefined,
        formData.notes
      );

      if (success) {
        toast({
          title: "Success",
          description: "Match data stored successfully!",
        });
        setShowForm(false);
        setSelectedMatch(null);
        setFormData({
          relationshipStatus: 'dating',
          satisfactionScore: '',
          notes: ''
        });
        loadData(); // Reload data
      } else {
        throw new Error('Failed to store match data');
      }
    } catch (error) {
      console.error('Error storing match data:', error);
      toast({
        title: "Error",
        description: "Failed to store match data",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportMatchData = () => {
    const dataStr = JSON.stringify(storedMatchData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading match data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Data Collector</h1>
          <p className="text-gray-600">Collect and manage successful match data for ML model training</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Database className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Matches</p>
                    <p className="text-2xl font-bold">{stats.totalMatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Matches</p>
                    <p className="text-2xl font-bold">{stats.activeMatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Satisfaction</p>
                    <p className="text-2xl font-bold">{stats.averageSatisfaction.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Download className="h-8 w-8 text-orange-500" />
                  <div>
                    <Button onClick={exportMatchData} variant="outline" size="sm">
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Successful Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Successful Matches ({successfulMatches.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {successfulMatches.map((match, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {match.user1Data.name} & {match.user2Data.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {match.user1Data.city} & {match.user2Data.city}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant="outline">{match.user1Data.age} & {match.user2Data.age}</Badge>
                          <Badge variant="secondary">Match ID: {match.matchId.slice(0, 8)}...</Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleSelectMatch(match)}
                        size="sm"
                        variant="outline"
                      >
                        Collect Data
                      </Button>
                    </div>
                  </div>
                ))}
                {successfulMatches.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No successful matches found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stored Match Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Stored Match Data ({storedMatchData.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {storedMatchData.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {record.user1Profile.name} & {record.user2Profile.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {record.relationshipStatus} • {record.matchDate.toLocaleDateString()}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <Badge variant={record.isActive ? "default" : "secondary"}>
                            {record.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {record.satisfactionScore && (
                            <Badge variant="outline">
                              Satisfaction: {record.satisfactionScore}/10
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {storedMatchData.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No stored match data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Collection Form */}
        {showForm && selectedMatch && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Collect Match Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">{selectedMatch.user1Data.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedMatch.user1Data.age} • {selectedMatch.user1Data.city}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedMatch.user1Data.bio}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{selectedMatch.user2Data.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedMatch.user2Data.age} • {selectedMatch.user2Data.city}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedMatch.user2Data.bio}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="relationshipStatus">Relationship Status</Label>
                  <Select 
                    value={formData.relationshipStatus} 
                    onValueChange={(value) => setFormData({...formData, relationshipStatus: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dating">Dating</SelectItem>
                      <SelectItem value="engaged">Engaged</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="separated">Separated</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="satisfactionScore">Satisfaction Score (1-10)</Label>
                  <Input
                    id="satisfactionScore"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.satisfactionScore}
                    onChange={(e) => setFormData({...formData, satisfactionScore: e.target.value})}
                    placeholder="Enter satisfaction score"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes about this match..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={handleSubmitMatchData}
                  disabled={processing}
                >
                  {processing ? 'Storing...' : 'Store Match Data'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MatchDataCollector;
